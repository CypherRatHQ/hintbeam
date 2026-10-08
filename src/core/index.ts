/**
 * `hintbeam/core` — the engine, with no React and no platform: define and validate tours on a
 * server, in a CMS or in CI; build a new platform, renderer, light style or plugin on top of it.
 *
 * Apps import from `hintbeam`, which has everything an app needs. This entry adds the engine
 * underneath: the player, the element registry, geometry and path maths.
 */

export { defineTargets, type TargetDefinition, type TargetName, type TourTargets, type DefineTargetsOptions } from "./targets.js";
export {
  TOUR_LIMITS,
  advanceOf,
  defineTour,
  formatTourProblems,
  parseTour,
  validateTour,
  type Advance,
  type AdvanceOn,
  type TourMeta,
  type TourParseResult,
  type TourProblem,
  type TourStep,
  type Tour,
} from "./tour.js";
export {
  center,
  edgeNormal,
  inflate,
  meetPoint,
  nearEdge,
  scrollToShow,
  visibilityOf,
  type Band,
  type Box,
  type Point,
  type PathRoute,
  type Strand,
  type Visibility,
} from "./geometry.js";
export { TOUR_PATHS, defineTourPath, routeThrough, type TourPathName, type TourPathOptions, type TourPath } from "./paths.js";
export {
  contains,
  edgeBeacon,
  placeStep,
  type CardInsets,
  type CardSide,
  type PlaceOptions,
  type StepPlacement,
  type Viewport,
} from "./layout.js";
export {
  ElementRegistry,
  EVERY_SCREEN,
  MEASURE_TIMEOUT_MS,
  measureWithin,
  type ElementEntry,
  type Located,
  type Measurable,
  type ScrollArea,
} from "./registry.js";
export { resolveTarget, type Highlight, type ResolveContext, type Where } from "./resolve.js";
export {
  EMPTY_PROGRESS,
  PROGRESS_LIMIT,
  createTourStorage,
  memoryTourStorage,
  mergeTourProgress,
  progressOf,
  type TourProgressState,
  type TourStorage,
  type TourProgress,
} from "./progress.js";
export { createManualRouter, noRouter, type TourRouter } from "./router.js";
export {
  IDLE,
  TourPlayer,
  type PlayerStartResult,
  type StepReason,
  type TourEvent,
  type TourPlayerOptions,
  type TourState,
} from "./player.js";
export {
  TOUR_PLUGIN_API_VERSION,
  acceptTours,
  composePlugins,
  type TourStartResult,
  type TourPluginApi,
  type TourPluginContext,
  type PluginErrorReporter,
  type PluginHost,
  type TourStartCheck,
  type TourPlugin,
  type TourUser,
} from "./plugins.js";

import type { TargetName as Name, TourTargets as AnyTargets } from "./targets.js";

/**
 * Register your targets once for autocomplete and type checking in `useTarget` everywhere:
 *
 * ```ts
 * declare module "hintbeam" {
 *   interface Register {
 *     targets: typeof targets;
 *   }
 * }
 * ```
 *
 * Without it, `useTarget` accepts any string and warns in development about names it does not know.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type RegisteredTargets = Register extends { targets: infer T extends AnyTargets } ? T : AnyTargets<string>;

/** The target names your app registered, or `string` if it has not. */
export type RegisteredTargetName = Name<RegisteredTargets>;
