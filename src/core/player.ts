/**
 * The player: which tour is playing, which step is showing, and how steps end. Pure TypeScript
 * over injected time and storage, so every rule here is tested without a screen.
 *
 * It knows nothing about screens or measuring. The React Native layer finds each step's target and
 * tells the player when the user tapped it, when a screen came to the front, and when the app
 * emitted an event.
 */

import type { TourTargets } from "./targets.js";
import { advanceOf, type TourStep, type Tour } from "./tour.js";
import {
  EMPTY_PROGRESS,
  memoryTourStorage,
  progressOf,
  recordComplete,
  recordSkip,
  recordStart,
  recordStep,
  type TourProgressState,
  type TourStorage,
} from "./progress.js";

/** Why the step changed. */
export type StepReason = "start" | "resume" | "next" | "back" | "tap" | "arrive" | "event";

export type PlayerStartResult = "started" | "resumed" | "already-playing";

export interface TourState {
  /** The tour playing now, or `null`. */
  tour: Tour | null;
  step: TourStep | null;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  /** An `event` step whose timeout passed: offer Next. */
  waitedTooLong: boolean;
}

export type TourEvent =
  | { type: "start"; tour: Tour; resumed: boolean; index: number }
  | { type: "step"; tour: Tour; index: number; reason: StepReason }
  | { type: "complete"; tour: Tour }
  | { type: "skip"; tour: Tour; index: number }
  | { type: "stop"; tour: Tour; index: number };

export interface TourPlayerOptions {
  targets: TourTargets;
  storage?: TourStorage;
  now?: () => Date;
  /** Schedules `run` after `ms` and returns a cancel. Injected so tests can drive time. */
  setTimer?: (run: () => void, ms: number) => () => void;
  /** Every start, step, completion, skip and stop — wire it to your analytics. */
  onEvent?: (event: TourEvent) => void;
}

export const IDLE: TourState = Object.freeze({
  tour: null,
  step: null,
  index: 0,
  total: 0,
  isFirst: true,
  isLast: true,
  waitedTooLong: false,
});

export class TourPlayer {
  private readonly targets: TourTargets;
  private readonly storage: TourStorage;
  private readonly now: () => Date;
  private readonly setTimer: (run: () => void, ms: number) => () => void;
  private onEvent: (event: TourEvent) => void;

  private progress: TourProgressState = EMPTY_PROGRESS;
  private readonly loaded: Promise<void>;
  private state: TourState = IDLE;
  private cancelTimer: (() => void) | null = null;
  private readonly listeners = new Set<(state: TourState) => void>();

  constructor(options: TourPlayerOptions) {
    this.targets = options.targets;
    this.storage = options.storage ?? memoryTourStorage();
    this.now = options.now ?? (() => new Date());
    this.setTimer =
      options.setTimer ??
      ((run, ms) => {
        const id = setTimeout(run, ms);
        return () => clearTimeout(id);
      });
    this.onEvent = options.onEvent ?? (() => undefined);
    this.loaded = this.storage.load().then(
      (saved) => {
        if (saved) this.progress = saved;
      },
      () => undefined,
    );
  }

  /** Replace the event callback (the provider passes the latest one on every render). */
  setOnEvent(onEvent: ((event: TourEvent) => void) | undefined): void {
    this.onEvent = onEvent ?? (() => undefined);
  }

  /** Resolves once saved progress has been read. */
  ready(): Promise<void> {
    return this.loaded;
  }

  getState = (): TourState => this.state;

  subscribe = (listener: (state: TourState) => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Whether the user has seen this tour through to the end at least once. */
  hasCompleted(tour: Pick<Tour, "id">): boolean {
    return progressOf(this.progress, tour.id)?.completedAt != null;
  }

  /** Whether the user finished or skipped this tour — they have seen it, so it shouldn't open by itself again. */
  hasSeen(tour: Pick<Tour, "id">): boolean {
    const known = progressOf(this.progress, tour.id);
    return known != null && (known.completedAt != null || known.skippedAt != null);
  }

  /** The step a skipped tour would resume at, or `null` if there is nothing to resume. */
  resumeIndex(tour: Tour): number | null {
    const known = progressOf(this.progress, tour.id);
    if (!known || known.skippedAt === null) return null;
    return known.step > 0 && known.step < tour.steps.length ? known.step : null;
  }

  /**
   * Play a tour from the first step. Starting the tour already playing does nothing (a double tap
   * on a button is one start); starting a different one replaces it.
   */
  async start(tour: Tour): Promise<PlayerStartResult> {
    return this.begin(tour, false);
  }

  /** Play a tour from where the user skipped it, or from the start if there is nothing to resume. */
  async resume(tour: Tour): Promise<PlayerStartResult> {
    return this.begin(tour, true);
  }

  next(reason: StepReason = "next"): void {
    const { tour, index } = this.state;
    if (!tour) return;
    if (index + 1 >= tour.steps.length) {
      this.complete(tour);
      return;
    }
    this.goTo(tour, index + 1, reason);
  }

  back(): void {
    const { tour, index } = this.state;
    if (tour && index > 0) this.goTo(tour, index - 1, "back");
  }

  /** Close the tour, remembering the step so it can be resumed. Never asks "are you sure?". */
  skip(): void {
    const { tour, index } = this.state;
    if (!tour) return;
    this.progress = recordSkip(this.progress, tour.id, index, this.stamp());
    this.save();
    this.end();
    this.onEvent({ type: "skip", tour, index });
  }

  /** Close the tour without recording anything — for when your app takes over. */
  stop(): void {
    const { tour, index } = this.state;
    if (!tour) return;
    this.end();
    this.onEvent({ type: "stop", tour, index });
  }

  /** The user tapped the highlighted target. Ends a `"tap"` step. */
  targetTapped(): void {
    if (this.state.step && advanceOf(this.state.step).kind === "tap") this.next("tap");
  }

  /** Your app reports that something happened. Ends a step waiting for this event. */
  emit(event: string): void {
    if (!this.state.step) return;
    const advance = advanceOf(this.state.step);
    if (advance.kind === "event" && advance.event === event) this.next("event");
  }

  /** A screen came to the front. Ends an `"arrive"` step whose target lives there. */
  screenChanged(screen: string | null): void {
    const step = this.state.step;
    if (!step || screen === null || advanceOf(step).kind !== "arrive") return;
    if (this.targets.has(step.target) && this.targets.screenOf(step.target) === screen) this.next("arrive");
  }

  private async begin(tour: Tour, resume: boolean): Promise<PlayerStartResult> {
    await this.loaded;
    if (this.state.tour?.id === tour.id) return "already-playing";
    const resumeAt = resume ? this.resumeIndex(tour) : null;
    const index = resumeAt ?? 0;
    this.progress = recordStart(this.progress, tour.id, this.stamp());
    if (index > 0) this.progress = recordStep(this.progress, tour.id, index, this.stamp());
    this.save();
    this.onEvent({ type: "start", tour, resumed: resumeAt !== null, index });
    this.show(tour, index, resumeAt !== null ? "resume" : "start");
    return resumeAt !== null ? "resumed" : "started";
  }

  private goTo(tour: Tour, index: number, reason: StepReason): void {
    this.progress = recordStep(this.progress, tour.id, index, this.stamp());
    this.save();
    this.show(tour, index, reason);
  }

  private complete(tour: Tour): void {
    this.progress = recordComplete(this.progress, tour.id, this.stamp());
    this.save();
    this.end();
    this.onEvent({ type: "complete", tour });
  }

  private show(tour: Tour, index: number, reason: StepReason): void {
    this.clearTimer();
    const step = tour.steps[index]!;
    const advance = advanceOf(step);
    if (advance.kind === "event") {
      this.cancelTimer = this.setTimer(() => {
        this.cancelTimer = null;
        if (this.state.tour === tour && this.state.index === index) this.set({ ...this.state, waitedTooLong: true });
      }, advance.timeout * 1000);
    }
    this.set({
      tour,
      step,
      index,
      total: tour.steps.length,
      isFirst: index === 0,
      isLast: index === tour.steps.length - 1,
      waitedTooLong: false,
    });
    this.onEvent({ type: "step", tour, index, reason });
  }

  private end(): void {
    this.clearTimer();
    this.set(IDLE);
  }

  private clearTimer(): void {
    this.cancelTimer?.();
    this.cancelTimer = null;
  }

  private save(): void {
    this.storage.save(this.progress).catch(() => undefined);
  }

  private stamp(): string {
    return this.now().toISOString();
  }

  private set(state: TourState): void {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }
}
