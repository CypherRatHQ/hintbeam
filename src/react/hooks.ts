import { useEffect, useMemo, useRef, useSyncExternalStore, type RefObject } from "react";
import type { TourState } from "../core/player.js";
import { EVERY_SCREEN } from "../core/registry.js";
import type { Tour } from "../core/tour.js";
import { useTourContext, type TourStartResult } from "./context.js";
import type { RegisteredTargetName } from "../core/index.js";

const isDev = typeof process !== "undefined" ? process.env?.["NODE_ENV"] !== "production" : true;

export interface UseTargetOptions {
  /** Corner radius of the element, so the highlight ring follows its shape. */
  radius?: number;
}

/**
 * Make an element pointable. Attach the returned ref to something you already render — nothing
 * is wrapped around it and its layout does not change.
 *
 * ```tsx
 * const search = useTarget("search");
 * return <input ref={search} />;           // web
 * return <TextInput ref={search} />;       // React Native
 * ```
 *
 * One element can carry several names (`useTarget(["search", "firstField"])`), and one name can be
 * carried by several elements (a phone tab bar and a desktop sidebar): whichever is drawn is used.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTarget<T = any>(
  name: RegisteredTargetName | readonly RegisteredTargetName[],
  options: UseTargetOptions = {},
): RefObject<T | null> {
  const { registry, targets, platform, targetsChanged } = useTourContext("useTarget");
  const ref = useRef<T | null>(null);
  const names = typeof name === "string" ? name : name.join("\u0000");
  const radius = options.radius;

  useEffect(() => {
    const offs: (() => void)[] = [];
    for (const one of names.split("\u0000")) {
      if (!targets.has(one)) {
        if (isDev) console.warn(`hintbeam: useTarget("${one}") — "${one}" is not in defineTargets(), so no tour can point at it.`);
        continue;
      }
      const measurable = platform.measurable(ref);
      offs.push(
        registry.registerTarget(targets.screenOf(one) ?? EVERY_SCREEN, one, radius === undefined ? { measurable } : { measurable, radius }),
      );
    }
    if (offs.length) targetsChanged();
    return () => {
      offs.forEach((off) => off());
      if (offs.length) targetsChanged();
    };
  }, [registry, targets, platform, names, radius, targetsChanged]);

  return ref;
}

/**
 * Mark the element that takes the user to a screen — a tab, a nav link, a menu item. When a
 * step's target is on that screen, the tour points here and offers "Take me there".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useScreenLink<T = any>(screen: string, options: UseTargetOptions = {}): RefObject<T | null> {
  const { registry, platform, targetsChanged } = useTourContext("useScreenLink");
  const ref = useRef<T | null>(null);
  const radius = options.radius;
  useEffect(() => {
    const measurable = platform.measurable(ref);
    const off = registry.registerScreenLink(screen, radius === undefined ? { measurable } : { measurable, radius });
    targetsChanged();
    return () => {
      off();
      targetsChanged();
    };
  }, [registry, platform, screen, radius, targetsChanged]);
  return ref;
}

export interface UseTour extends TourState {
  /** Whether a tour is showing. */
  isActive: boolean;
  /**
   * Play a tour from the first step — a tour object, or the id of one passed to `TourProvider tours`
   * or provided by a plugin. Calling it again while it plays does nothing.
   */
  start(tour: Tour | string): Promise<TourStartResult>;
  /** Play a tour from where the user skipped it (or from the start). */
  resume(tour: Tour | string): Promise<TourStartResult>;
  /**
   * Play a tour only if this user has never finished or skipped it — for a first-visit tour. Call
   * it on page load: it waits for saved progress first, so it is right with any `storage`, sync or
   * async. Resolves to `"seen"` when it does nothing. Pass `storage` to remember across reloads.
   */
  startOnce(tour: Tour | string): Promise<TourStartResult>;
  next(): void;
  back(): void;
  /** Close, remembering the step for `resume`. */
  skip(): void;
  /** Close without remembering anything. */
  stop(): void;
  /** Tell a waiting step that something happened: `emit("meal.logged")`. */
  emit(event: string): void;
  hasCompleted(tour: Pick<Tour, "id">): boolean;
  canResume(tour: Tour): boolean;
}

/** Start, steer and observe tours from any component inside `TourProvider`. */
export function useTour(): UseTour {
  const context = useTourContext("useTour");
  const { player } = context;
  const state = useSyncExternalStore(player.subscribe, player.getState, player.getState);
  return useMemo(
    () => ({
      ...state,
      isActive: state.tour !== null,
      start: context.start,
      resume: context.resume,
      startOnce: context.startOnce,
      next: () => player.next(),
      back: () => player.back(),
      skip: () => player.skip(),
      stop: () => player.stop(),
      emit: (event) => player.emit(event),
      hasCompleted: (tour) => player.hasCompleted(tour),
      canResume: (tour) => player.resumeIndex(tour) !== null,
    }),
    [context, player, state],
  );
}
