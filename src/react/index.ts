/**
 * The shared React layer. Platform entry points (`hintbeam/web`, `hintbeam/native`) re-export all
 * of this together with their `TourProvider`.
 *
 * This is the app-facing API: what you need to write, show, theme and remember tours. Every name
 * that is not a hook says "tour", so nothing clashes with your UI kit, router or own code. The
 * engine underneath (player, registry, geometry, path maths) is in `hintbeam/core`.
 */

// Targets and tours
export {
  defineTargets,
  type DefineTargetsOptions,
  type TargetDefinition,
  type TargetName,
  type TourTargets,
  type Register,
  type RegisteredTargetName,
} from "../core/index.js";
export {
  defineTour,
  parseTour,
  validateTour,
  formatTourProblems,
  TOUR_LIMITS,
  type AdvanceOn,
  type Tour,
  type TourMeta,
  type TourParseResult,
  type TourProblem,
  type TourStep,
} from "../core/index.js";

// Progress
export { createTourStorage, mergeTourProgress, type TourProgress, type TourProgressState, type TourStorage } from "../core/index.js";

// Routers, events and plugins
export {
  createManualRouter,
  TOUR_PLUGIN_API_VERSION,
  type TourEvent,
  type TourPlugin,
  type TourPluginApi,
  type TourPluginContext,
  type TourRouter,
  type TourStartCheck,
  type TourStartResult,
  type TourState,
  type TourUser,
} from "../core/index.js";

// Light styles
export { TOUR_PATHS, defineTourPath, type TourPath, type TourPathName, type TourPathOptions } from "../core/index.js";

// Look and words
export { TOUR_LABELS, type TourLabels } from "./labels.js";
export {
  createTourTheme,
  TOUR_STYLES,
  TOUR_THEMES,
  type CreateTourThemeOptions,
  type TourStyle,
  type TourStylePreset,
  type TourTheme,
  type TourThemeInput,
} from "./theme.js";

// Components and hooks
export { useScreenLink, useTarget, useTour, type UseTargetOptions, type UseTour } from "./hooks.js";
export { useTourStep, type TourStepView } from "./useTourStep.js";
export { useRouterAdapter } from "./routing.js";
export { createTourProvider, useTours, type TourProviderProps } from "./TourProvider.js";
export type { TourPlatform, TourStepUIProps } from "./platform.js";
