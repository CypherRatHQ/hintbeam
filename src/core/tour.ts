/**
 * A tour is data: a short list of steps, each pointing at a declared target with a line or two of
 * plain words and a rule for how it ends. One validator serves tours written in code and tours
 * loaded from JSON, with the same messages.
 */

import type { TourTargets } from "./targets.js";

export const TOUR_LIMITS = {
  /** Steps in one tour. Longer tours are skipped by users; split them. */
  steps: 8,
  title: 60,
  text: 160,
  /** Seconds an `event` step waits before offering Next anyway. */
  timeoutMin: 5,
  timeoutMax: 300,
  timeoutDefault: 30,
  /** Largest `meta` object, as JSON. */
  metaBytes: 4096,
} as const;

/**
 * How a step ends:
 *  - `"next"` — the user taps Next (the default);
 *  - `"tap"` — the user taps the thing the step points at;
 *  - `"arrive"` — the user reaches the screen the target is on;
 *  - `{ event, timeout }` — your app calls `emit(event)`; Next appears after `timeout` seconds anyway.
 */
export type AdvanceOn = "next" | "tap" | "arrive" | { event: string; timeout?: number };

/**
 * Free-form data that travels with a tour or step and is never shown to users: a version, an
 * experiment, an audience, an editor's notes. Plain JSON values only, up to `TOUR_LIMITS.metaBytes`.
 */
export type TourMeta = Record<string, unknown>;

export interface TourStep<Name extends string = string> {
  target: Name;
  title?: string;
  text: string;
  advanceOn?: AdvanceOn;
  meta?: TourMeta;
}

export interface Tour<Name extends string = string> {
  id: string;
  steps: readonly TourStep<Name>[];
  meta?: TourMeta;
}

export interface TourProblem {
  /** Where in the tour, e.g. `steps[2].target`. */
  path: string;
  message: string;
}

export type TourParseResult<Name extends string> = { ok: true; tour: Tour<Name> } | { ok: false; problems: TourProblem[] };

/** The normalised form of `advanceOn`, used by the player. */
export type Advance = { kind: "next" } | { kind: "tap" } | { kind: "arrive" } | { kind: "event"; event: string; timeout: number };

export function advanceOf(step: Pick<TourStep, "advanceOn">): Advance {
  const on = step.advanceOn ?? "next";
  if (typeof on === "string") return { kind: on };
  return { kind: "event", event: on.event, timeout: on.timeout ?? TOUR_LIMITS.timeoutDefault };
}

const ID = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
// Plain words on one line: no control characters, no markup brackets.
const PLAIN = /^[^\p{Cc}<>]*$/u;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function checkWords(value: unknown, path: string, min: number, max: number, problems: TourProblem[]): void {
  if (typeof value !== "string") {
    problems.push({ path, message: "Write this as text." });
    return;
  }
  const length = value.trim().length;
  if (length < min) problems.push({ path, message: `Use at least ${min} characters.` });
  if (length > max) problems.push({ path, message: `Use at most ${max} characters (this has ${length}).` });
  if (!PLAIN.test(value)) problems.push({ path, message: "Use plain words on one line, without < or >." });
}

function checkKnownFields(value: Record<string, unknown>, allowed: readonly string[], path: string, problems: TourProblem[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      problems.push({
        path: path ? `${path}.${key}` : key,
        message: `"${key}" is not a field here. Expected one of: ${allowed.join(", ")}.`,
      });
    }
  }
}

function checkAdvanceOn(value: unknown, path: string, targets: TourTargets, target: string | null, problems: TourProblem[]): void {
  if (value === "next" || value === "tap") return;
  if (value === "arrive") {
    if (target !== null && targets.screenOf(target) === null) {
      problems.push({ path, message: `"${target}" is on every screen, so there is nowhere to arrive. Use "next" or "tap".` });
    }
    return;
  }
  if (!isRecord(value)) {
    problems.push({ path, message: 'Use "next", "tap", "arrive", or { event: "name" }.' });
    return;
  }
  checkKnownFields(value, ["event", "timeout"], path, problems);
  const event = value["event"];
  if (typeof event !== "string" || event.length === 0) {
    problems.push({ path: `${path}.event`, message: "Name the event this step waits for." });
  } else if (targets.events && !targets.events.includes(event)) {
    problems.push({ path: `${path}.event`, message: `"${event}" is not a declared event. Declared: ${targets.events.join(", ")}.` });
  }
  const timeout = value["timeout"];
  if (
    timeout !== undefined &&
    (typeof timeout !== "number" || !Number.isInteger(timeout) || timeout < TOUR_LIMITS.timeoutMin || timeout > TOUR_LIMITS.timeoutMax)
  ) {
    problems.push({
      path: `${path}.timeout`,
      message: `Use a whole number of seconds from ${TOUR_LIMITS.timeoutMin} to ${TOUR_LIMITS.timeoutMax}.`,
    });
  }
}

function checkMeta(value: unknown, path: string, problems: TourProblem[]): void {
  if (!isRecord(value)) {
    problems.push({ path, message: "Use an object of plain values for meta." });
    return;
  }
  let json: string;
  try {
    json = JSON.stringify(value);
  } catch {
    problems.push({ path, message: "Use plain JSON values in meta." });
    return;
  }
  if (json.length > TOUR_LIMITS.metaBytes) problems.push({ path, message: `Keep meta under ${TOUR_LIMITS.metaBytes} characters of JSON.` });
}

/** Every problem with a tour, or an empty list. Never throws. */
export function validateTour(input: unknown, targets: TourTargets): TourProblem[] {
  if (!isRecord(input)) return [{ path: "", message: "A tour is an object with an id and steps." }];
  const problems: TourProblem[] = [];
  checkKnownFields(input, ["id", "steps", "meta"], "", problems);
  if (input["meta"] !== undefined) checkMeta(input["meta"], "meta", problems);

  const id = input["id"];
  if (typeof id !== "string" || !ID.test(id)) {
    problems.push({ path: "id", message: "Use letters, digits, dots, dashes or underscores, up to 64 characters." });
  }

  const steps = input["steps"];
  if (!Array.isArray(steps)) {
    problems.push({ path: "steps", message: "Give the tour a list of steps." });
    return problems;
  }
  if (steps.length === 0) problems.push({ path: "steps", message: "A tour needs at least one step." });
  if (steps.length > TOUR_LIMITS.steps) {
    problems.push({
      path: "steps",
      message: `Keep a tour to ${TOUR_LIMITS.steps} steps or fewer (this has ${steps.length}). Split it into two tours.`,
    });
  }

  steps.forEach((step, index) => {
    const path = `steps[${index}]`;
    if (!isRecord(step)) {
      problems.push({ path, message: "A step is an object with a target and text." });
      return;
    }
    checkKnownFields(step, ["target", "title", "text", "advanceOn", "meta"], path, problems);
    if (step["meta"] !== undefined) checkMeta(step["meta"], `${path}.meta`, problems);
    const target = step["target"];
    let known: string | null = null;
    if (typeof target !== "string") {
      problems.push({ path: `${path}.target`, message: "Name the target this step points at." });
    } else if (!targets.has(target)) {
      const hint = suggest(target, targets.names);
      problems.push({ path: `${path}.target`, message: `"${target}" is not a declared target.${hint ? ` Did you mean "${hint}"?` : ""}` });
    } else {
      known = target;
    }
    if (step["title"] !== undefined) checkWords(step["title"], `${path}.title`, 2, TOUR_LIMITS.title, problems);
    checkWords(step["text"], `${path}.text`, 4, TOUR_LIMITS.text, problems);
    if (step["advanceOn"] !== undefined) checkAdvanceOn(step["advanceOn"], `${path}.advanceOn`, targets, known, problems);
  });

  return problems;
}

/** A tour from data you do not control (a JSON file, an API, a CMS): the tour, or its problems. */
export function parseTour<Name extends string>(input: unknown, targets: TourTargets<Name>): TourParseResult<Name> {
  const problems = validateTour(input, targets);
  return problems.length === 0 ? { ok: true, tour: input as Tour<Name> } : { ok: false, problems };
}

/** Problems as one readable message. */
export function formatTourProblems(id: unknown, problems: readonly TourProblem[]): string {
  const name = typeof id === "string" ? `Tour "${id}"` : "Tour";
  return (
    `${name} has ${problems.length === 1 ? "a problem" : `${problems.length} problems`}:\n` +
    problems.map((p) => `  • ${p.path || "(tour)"}: ${p.message}`).join("\n")
  );
}

/**
 * A tour written in code. Typed to your declared targets, so a misspelt target is a compile
 * error. The rules a type cannot express are checked too, and throw straight away with the same
 * messages a JSON tour gets.
 */
export function defineTour<Name extends string>(targets: TourTargets<Name>, tour: Tour<NoInfer<Name>>): Tour<Name> {
  const problems = validateTour(tour, targets);
  if (problems.length > 0) throw new Error(`hintbeam: ${formatTourProblems(tour.id, problems)}`);
  return tour;
}

/** The closest declared name, for "did you mean" hints. */
function suggest(input: string, names: readonly string[]): string | null {
  let best: string | null = null;
  let bestDistance = Math.max(2, Math.floor(input.length / 3)) + 1;
  for (const name of names) {
    const d = distance(input.toLowerCase(), name.toLowerCase());
    if (d < bestDistance) {
      best = name;
      bestDistance = d;
    }
  }
  return best;
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length]!;
}
