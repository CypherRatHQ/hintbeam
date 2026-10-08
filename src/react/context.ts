import { createContext, useContext } from "react";
import type { Box } from "../core/geometry.js";
import type { TourPath } from "../core/paths.js";
import type { TourPlayer } from "../core/player.js";
import type { TourStartResult } from "../core/plugins.js";
import type { ElementRegistry } from "../core/registry.js";
import type { TourRouter } from "../core/router.js";
import type { TourTargets } from "../core/targets.js";
import type { Tour } from "../core/tour.js";
import type { TourLabels } from "./labels.js";
import type { TourPlatform } from "./platform.js";
import type { TourTheme } from "./theme.js";

export type { TourStartResult };

/** The tours that can be started by id. */
export interface TourCatalog {
  get(): readonly Tour[];
  find(id: string): Tour | null;
  subscribe(listener: () => void): () => void;
}

export interface TourContextValue {
  targets: TourTargets;
  registry: ElementRegistry;
  player: TourPlayer;
  router: TourRouter;
  platform: TourPlatform;
  catalog: TourCatalog;
  labels: TourLabels;
  theme: TourTheme;
  path: TourPath;
  start(tour: Tour | string): Promise<TourStartResult>;
  resume(tour: Tour | string): Promise<TourStartResult>;
  startOnce(tour: Tour | string): Promise<TourStartResult>;
  /** Something moved (a scroll settled, a resize): find the current target again. */
  invalidate(): void;
  /** A target or screen link mounted or unmounted: look again, once per batch of changes. */
  targetsChanged(): void;
  subscribeInvalidate(listener: () => void): () => void;
  /** The box currently highlighted, for telling a tap on the target from any other tap. */
  setHighlight(box: Box | null): void;
}

export const TourContext = createContext<TourContextValue | null>(null);

export function useTourContext(hook: string): TourContextValue {
  const value = useContext(TourContext);
  if (!value) {
    throw new Error(
      `hintbeam: ${hook} must be used inside <TourProvider>. Wrap your app — or your root layout — in <TourProvider targets={targets}>.`,
    );
  }
  return value;
}
