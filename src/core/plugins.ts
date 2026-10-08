/**
 * Plugins extend hintbeam without forking it. Everything in this repository is free and MIT and
 * uses this same API; add-ons — hosted tours, analytics, audience targeting, visual editors, extra
 * path styles — plug in here too.
 *
 * The contract is versioned (`TOUR_PLUGIN_API_VERSION`). A plugin can add tours, path styles and checks,
 * observe events and drive the player through `TourPluginApi`; it cannot change how targets are found,
 * how steps end, or what the core renders.
 */

import type { Box } from "./geometry.js";
import type { PlayerStartResult, TourEvent, TourState } from "./player.js";
import type { TourPath } from "./paths.js";
import type { TourTargets } from "./targets.js";
import { parseTour, type TourProblem, type Tour } from "./tour.js";

/** The version of the plugin contract this build implements. Bumped only for breaking changes. */
export const TOUR_PLUGIN_API_VERSION = 1;

/** Who is using the app — for audiences, analytics and per-user progress. Never required. */
export interface TourUser {
  id?: string;
  traits?: Record<string, unknown>;
}

/** What every plugin hook can see about where it is running. */
export interface TourPluginContext {
  user: TourUser | null;
  /** "web" or "native" (or a third-party platform's name). */
  platform: string;
}

export interface TourStartCheck extends TourPluginContext {
  tour: Tour;
  /** Whether this user has completed this tour before. */
  completed: boolean;
}

/** What `start` resolves to. `"seen"` only comes from `startOnce`: the user already finished or skipped it. */
export type TourStartResult = PlayerStartResult | "blocked" | "unknown-tour" | "seen";

/** What a plugin may do with the running provider, from `setup`. */
export interface TourPluginApi {
  readonly targets: TourTargets;
  readonly platform: string;
  getUser(): TourUser | null;
  /** Start a tour object, or a tour by id from the catalog. Goes through every `canStart`. */
  start(tour: Tour | string): Promise<TourStartResult>;
  stop(): void;
  getState(): TourState;
  currentScreen(): string | null;
  /** Targets drawn on the current screen now, with their boxes — for visual editors and recorders. */
  drawnTargets(): Promise<{ name: string; box: Box }[]>;
  /** Add tours to the catalog at runtime (a live preview, a late fetch). Each is validated first. */
  addTours(tours: readonly unknown[]): { added: string[]; rejected: { id: unknown; problems: TourProblem[] }[] };
}

export interface TourPlugin {
  /** Unique, e.g. "analytics" or "acme/segment". Shown in development warnings. */
  name: string;
  /** The plugin contract version this plugin was written for. Defaults to 1. */
  apiVersion?: number;
  /** Extra path styles, usable as `<TourProvider path="name">`. */
  paths?: Record<string, TourPath>;
  /**
   * Tours from somewhere else — a CMS, a hosted editor, a file. Returned as plain data: each one is
   * validated against your declared targets, and invalid tours are reported and left out.
   */
  tours?(context: TourPluginContext): readonly unknown[] | Promise<readonly unknown[]>;
  /**
   * Decide whether a tour may start — audiences, frequency caps, experiments, entitlements.
   * Return `false` to keep it from starting. Every plugin must agree.
   */
  canStart?(check: TourStartCheck): boolean | Promise<boolean>;
  /** Every start, step, completion, skip and stop. */
  onEvent?(event: TourEvent, context: TourPluginContext): void;
  /** Runs when the provider mounts. Return a function to clean up when it unmounts. */
  setup?(api: TourPluginApi): void | (() => void);
}

export interface PluginHost {
  readonly plugins: readonly TourPlugin[];
  paths: Record<string, TourPath>;
  onEvent(event: TourEvent, context: TourPluginContext): void;
  canStart(check: TourStartCheck): Promise<boolean>;
  /** Every plugin's tours, validated. Invalid ones are reported and dropped. */
  loadTours(context: TourPluginContext, targets: TourTargets): Promise<Tour[]>;
  setup(api: TourPluginApi): () => void;
}

export type PluginErrorReporter = (plugin: string, error: unknown) => void;

/** Validate tours from outside: the valid ones, and a report for each rejected one. */
export function acceptTours(
  input: readonly unknown[],
  targets: TourTargets,
): { tours: Tour[]; rejected: { id: unknown; problems: TourProblem[] }[] } {
  const tours: Tour[] = [];
  const rejected: { id: unknown; problems: TourProblem[] }[] = [];
  for (const candidate of input) {
    const parsed = parseTour(candidate, targets);
    if (parsed.ok) tours.push(parsed.tour);
    else rejected.push({ id: (candidate as { id?: unknown } | null)?.id, problems: parsed.problems });
  }
  return { tours, rejected };
}

/** Combine plugins into one host. Later plugins' paths override earlier ones with the same name. */
export function composePlugins(plugins: readonly TourPlugin[], report: PluginErrorReporter = () => undefined): PluginHost {
  const names = new Set<string>();
  for (const plugin of plugins) {
    if (names.has(plugin.name)) report(plugin.name, new Error(`Two plugins are named "${plugin.name}".`));
    names.add(plugin.name);
    if ((plugin.apiVersion ?? 1) > TOUR_PLUGIN_API_VERSION) {
      report(
        plugin.name,
        new Error(`Plugin needs plugin API v${plugin.apiVersion}; this hintbeam supports v${TOUR_PLUGIN_API_VERSION}. Update hintbeam.`),
      );
    }
  }
  const paths: Record<string, TourPath> = {};
  for (const plugin of plugins) Object.assign(paths, plugin.paths);

  return {
    plugins,
    paths,
    onEvent(event, context) {
      for (const plugin of plugins) {
        try {
          plugin.onEvent?.(event, context);
        } catch (error) {
          report(plugin.name, error);
        }
      }
    },
    async canStart(check) {
      for (const plugin of plugins) {
        if (!plugin.canStart) continue;
        try {
          if ((await plugin.canStart(check)) === false) return false;
        } catch (error) {
          // A plugin that fails never blocks a tour: the open-source behaviour wins.
          report(plugin.name, error);
        }
      }
      return true;
    },
    async loadTours(context, targets) {
      const results = await Promise.all(
        plugins.map(async (plugin) => {
          if (!plugin.tours) return [];
          try {
            const { tours, rejected } = acceptTours(await plugin.tours(context), targets);
            for (const r of rejected) {
              report(
                plugin.name,
                new Error(`Tour ${JSON.stringify(r.id)} was rejected: ${r.problems.map((p) => `${p.path}: ${p.message}`).join("; ")}`),
              );
            }
            return tours;
          } catch (error) {
            report(plugin.name, error);
            return [];
          }
        }),
      );
      return results.flat();
    },
    setup(api) {
      const cleanups: (() => void)[] = [];
      for (const plugin of plugins) {
        try {
          const cleanup = plugin.setup?.(api);
          if (typeof cleanup === "function") cleanups.push(cleanup);
        } catch (error) {
          report(plugin.name, error);
        }
      }
      return () => {
        for (const cleanup of cleanups.reverse()) {
          try {
            cleanup();
          } catch {
            // Cleanup failures are not worth surfacing on unmount.
          }
        }
      };
    },
  };
}
