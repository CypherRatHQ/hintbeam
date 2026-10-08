/**
 * Targets: the closed set of things a tour may point at, declared once by the app.
 *
 * Declaring them gives two things at once: a runtime list, so a tour loaded from JSON can be
 * checked against it, and a TypeScript union, so a tour written in code cannot name a target that
 * does not exist.
 */

export interface TargetDefinition {
  /**
   * The screen this target is drawn on, named the way your router names screens (a path such as
   * `"/food"` with expo-router, a route name such as `"Food"` with React Navigation).
   * Leave it out for something drawn on every screen — a tab bar button, a header icon.
   */
  screen?: string | null;
  /** One line saying what is there. For whoever writes tours; never shown to app users. */
  about?: string;
}

export interface DefineTargetsOptions {
  /** Event names a step may wait for. When given, a step's `event` must be one of them. */
  events?: readonly string[];
}

export interface TourTargets<Name extends string = string> {
  readonly names: readonly Name[];
  /** Declared event names, or `null` when the app accepts any event name. */
  readonly events: readonly string[] | null;
  has(name: string): name is Name;
  /** The screen a target lives on, or `null` for one drawn on every screen. */
  screenOf(name: Name): string | null;
  about(name: Name): string | null;
}

/** The names declared with `defineTargets`: `TargetName<typeof targets>`. */
export type TargetName<T> = T extends TourTargets<infer Name> ? Name : never;

export function defineTargets<const D extends Record<string, TargetDefinition>>(
  definitions: D,
  options: DefineTargetsOptions = {},
): TourTargets<Extract<keyof D, string>> {
  type Name = Extract<keyof D, string>;
  const names = Object.keys(definitions) as Name[];
  for (const name of names) {
    if (name.length === 0 || name.trim() !== name) {
      throw new Error(`hintbeam: target name ${JSON.stringify(name)} must be non-empty, with no surrounding spaces.`);
    }
  }
  const known = new Set<string>(names);
  const events = options.events ? [...options.events] : null;
  return {
    names,
    events,
    has: (name: string): name is Name => known.has(name),
    screenOf: (name) => definitions[name]?.screen ?? null,
    about: (name) => definitions[name]?.about ?? null,
  };
}
