import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Box, Point } from "../core/geometry.js";
import { contains } from "../core/layout.js";
import { TOUR_PATHS, type TourPathName, type TourPath } from "../core/paths.js";
import { TourPlayer, type TourEvent } from "../core/player.js";
import {
  acceptTours,
  composePlugins,
  type TourStartResult,
  type TourPluginApi,
  type TourPluginContext,
  type TourPlugin,
  type TourUser,
} from "../core/plugins.js";
import type { TourStorage } from "../core/progress.js";
import { ElementRegistry } from "../core/registry.js";
import { noRouter, type TourRouter } from "../core/router.js";
import type { TourTargets } from "../core/targets.js";
import { advanceOf, type Tour } from "../core/tour.js";
import { TourContext, useTourContext, type TourCatalog, type TourContextValue } from "./context.js";
import { TOUR_LABELS, type TourLabels } from "./labels.js";
import type { TourPlatform } from "./platform.js";
import { resolveTourTheme, type TourThemeInput } from "./theme.js";
import { useTourStep, type TourStepView } from "./useTourStep.js";

const isDev = typeof process !== "undefined" ? process.env?.["NODE_ENV"] !== "production" : true;

export interface TourProviderProps {
  /** What tours can point at — from `defineTargets`. */
  targets: TourTargets;
  /** Your router, so tours can follow users between screens. Without one, everything is one screen. */
  router?: TourRouter;
  /** Where progress is remembered. Defaults to memory (lost on reload). */
  storage?: TourStorage;
  /** Every word users read, for translation or tone. */
  labels?: Partial<TourLabels>;
  /** Colours, radius, spacing, font — build one with `createTourTheme`, or start from `TOUR_THEMES`. */
  theme?: TourThemeInput;
  /** How the light travels: "wave", "strands", "straight", "elbow", "arc", or a plugin's style. Defaults to the theme's `path`, then "wave". */
  path?: TourPathName | (string & {});
  /** Tours you can start by id with `start("id")`, next to any that plugins provide. */
  tours?: readonly Tour[];
  /** Who is using the app. Passed to plugins for audiences and analytics; hintbeam itself never sends it anywhere. */
  user?: TourUser | null;
  /** Add-ons: analytics, audiences, hosted tours, path styles. */
  plugins?: readonly TourPlugin[];
  /** Every start, step, completion, skip and stop — wire it to your analytics. */
  onEvent?: (event: TourEvent) => void;
  /** Your own step UI. Pass `null` to render nothing and drive everything with `useTourStep`. */
  renderStep?: ((step: TourStepView) => ReactNode) | null;
  children?: ReactNode;
}

function Stage({
  platform,
  renderStep,
  setHighlight,
}: {
  platform: TourPlatform;
  renderStep: TourProviderProps["renderStep"];
  setHighlight(box: Box | null): void;
}) {
  const view = useTourStep();
  const { theme, path } = useTourContext("TourProvider");
  const box = view.highlight?.box ?? null;
  useEffect(() => {
    setHighlight(view.where?.kind === "visible" ? box : null);
  }, [box, view.where?.kind, setHighlight]);
  platform.useKeyboard?.({ next: view.next, back: view.back, skip: view.skip, active: view.step !== null });
  if (!view.step || renderStep === null) return null;
  if (renderStep) return <>{renderStep(view)}</>;
  return <platform.StepUI view={view} theme={theme} path={path} />;
}

/** A small store for the tour catalog, so `useTours` re-renders when plugins add tours. */
function createCatalog(): TourCatalog & { replace(source: string, tours: readonly Tour[]): void } {
  const sources = new Map<string, readonly Tour[]>();
  let snapshot: readonly Tour[] = [];
  const listeners = new Set<() => void>();
  return {
    get: () => snapshot,
    find: (id) => snapshot.find((tour) => tour.id === id) ?? null,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    replace(source, tours) {
      sources.set(source, tours);
      // Later sources win for the same id: app tours first, then plugins, then runtime additions.
      const byId = new Map<string, Tour>();
      for (const list of sources.values()) for (const tour of list) byId.set(tour.id, tour);
      snapshot = [...byId.values()];
      for (const listener of listeners) listener();
    },
  };
}

/** Build a `TourProvider` for a platform. `hintbeam/web` and `hintbeam/native` export theirs. */
export function createTourProvider(platform: TourPlatform) {
  function TourProvider(props: TourProviderProps) {
    const {
      targets,
      router = noRouter,
      storage,
      labels,
      theme,
      path: pathProp,
      tours,
      user = null,
      plugins = [],
      onEvent,
      renderStep,
      children,
    } = props;

    const host = useMemo(
      () => composePlugins(plugins, (name, error) => isDev && console.warn(`hintbeam: plugin "${name}":`, error)),
      // Plugins are usually a constant array; compare by each plugin's identity.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      plugins,
    );

    const [registry] = useState(() => {
      const created = new ElementRegistry();
      created.setDefaultScrollArea(platform.defaultScrollArea?.() ?? null);
      return created;
    });
    const [player] = useState(() => (storage ? new TourPlayer({ targets, storage }) : new TourPlayer({ targets })));
    const [catalog] = useState(createCatalog);

    // The latest props, for callbacks that must keep a stable identity.
    const latest = useRef({ onEvent, host, user });
    latest.current = { onEvent, host, user };
    const pluginContext = useMemo(() => (): TourPluginContext => ({ user: latest.current.user, platform: platform.name }), []);

    useEffect(() => {
      player.setOnEvent((event) => {
        latest.current.onEvent?.(event);
        latest.current.host.onEvent(event, pluginContext());
      });
    }, [player, pluginContext]);

    // Follow the router: an "arrive" step ends when its screen comes to the front.
    useEffect(() => router.subscribe((screen) => player.screenChanged(screen)), [router, player]);

    // The catalog: the app's own tours, then every plugin's — all validated.
    useEffect(() => {
      const { tours: accepted, rejected } = acceptTours(tours ?? [], targets);
      for (const r of rejected)
        if (isDev) console.warn(`hintbeam: tour ${JSON.stringify(r.id)} in <TourProvider tours> is invalid.`, r.problems);
      catalog.replace("app", accepted);
    }, [tours, targets, catalog]);
    const userId = user?.id;
    useEffect(() => {
      let alive = true;
      void host.loadTours(pluginContext(), targets).then((loaded) => {
        if (alive) catalog.replace("plugins", loaded);
      });
      return () => {
        alive = false;
      };
    }, [host, targets, catalog, pluginContext, userId]);

    const listeners = useRef(new Set<() => void>());
    const highlight = useRef<Box | null>(null);
    const invalidate = useMemo(() => () => listeners.current.forEach((listener) => listener()), []);
    platform.useLayoutChanges(invalidate);
    // An element that renders late (after data loads, behind a toggle) is found as soon as it mounts.
    // Many mount together, so the look-again runs once per batch.
    const targetsChanged = useMemo(() => {
      let queued = false;
      return () => {
        if (queued) return;
        queued = true;
        queueMicrotask(() => {
          queued = false;
          invalidate();
        });
      };
    }, [invalidate]);

    const resolvedTheme = useMemo(() => resolveTourTheme(theme), [theme]);
    const path = pathProp ?? resolvedTheme.path ?? "wave";
    const style = useMemo<TourPath>(() => {
      const styles: Record<string, TourPath> = { ...TOUR_PATHS, ...host.paths };
      const chosen = styles[path];
      if (!chosen && isDev)
        console.warn(`hintbeam: path "${path}" is not a known style. Using "wave". Known: ${Object.keys(styles).join(", ")}.`);
      return chosen ?? TOUR_PATHS.wave;
    }, [path, host]);

    const control = useMemo(() => {
      const gate = async (tourOrId: Tour | string, mode: "start" | "resume" | "once"): Promise<TourStartResult> => {
        const tour = typeof tourOrId === "string" ? catalog.find(tourOrId) : tourOrId;
        if (!tour) {
          if (isDev)
            console.warn(
              `hintbeam: no tour with id "${String(tourOrId)}". Known: ${
                catalog
                  .get()
                  .map((t) => t.id)
                  .join(", ") || "none"
              }.`,
            );
          return "unknown-tour";
        }
        await player.ready();
        // After saved progress has loaded, so the answer is right with any storage, sync or async.
        if (mode === "once" && player.hasSeen(tour)) return "seen";
        const allowed = await latest.current.host.canStart({ ...pluginContext(), tour, completed: player.hasCompleted(tour) });
        if (!allowed) return "blocked";
        return mode === "start" ? player.start(tour) : player.resume(tour);
      };
      return {
        start: (t: Tour | string) => gate(t, "start"),
        resume: (t: Tour | string) => gate(t, "resume"),
        startOnce: (t: Tour | string) => gate(t, "once"),
      };
    }, [player, catalog, pluginContext]);

    // Plugins that drive the player (live preview, visual editors) get a small, stable API.
    useEffect(() => {
      let runtime = 0;
      const api: TourPluginApi = {
        targets,
        platform: platform.name,
        getUser: () => latest.current.user,
        start: control.start,
        stop: () => player.stop(),
        getState: player.getState,
        currentScreen: () => router.currentScreen(),
        drawnTargets: () => registry.drawnTargets(router.currentScreen()),
        addTours: (input) => {
          const { tours: accepted, rejected } = acceptTours(input, targets);
          runtime += 1;
          catalog.replace(`runtime-${runtime}`, accepted);
          return { added: accepted.map((t) => t.id), rejected };
        },
      };
      return host.setup(api);
    }, [host, targets, control, player, router, registry, catalog]);

    const value = useMemo<TourContextValue>(
      () => ({
        targets,
        registry,
        player,
        router,
        platform,
        catalog,
        labels: { ...TOUR_LABELS, ...labels },
        theme: resolvedTheme,
        path: style,
        start: control.start,
        resume: control.resume,
        startOnce: control.startOnce,
        invalidate,
        targetsChanged,
        subscribeInvalidate: (listener) => {
          listeners.current.add(listener);
          return () => {
            listeners.current.delete(listener);
          };
        },
        setHighlight: (box) => {
          highlight.current = box;
        },
      }),
      [targets, registry, player, router, catalog, labels, resolvedTheme, style, control, invalidate, targetsChanged],
    );

    const onTap = useMemo(
      () => (point: Point) => {
        const step = player.getState().step;
        if (!step || advanceOf(step).kind !== "tap") return;
        if (highlight.current) {
          if (contains(highlight.current, point)) player.targetTapped();
          return;
        }
        // Tapped before the step finished measuring its target: measure now.
        void registry.locate(step.target, router.currentScreen()).then((found) => {
          if (found && contains(found.box, point) && player.getState().step === step) player.targetTapped();
        });
      },
      [player, registry, router],
    );

    return (
      <TourContext.Provider value={value}>
        <platform.TapObserver onTap={onTap}>{children}</platform.TapObserver>
        <Stage platform={platform} renderStep={renderStep} setHighlight={value.setHighlight} />
      </TourContext.Provider>
    );
  }
  TourProvider.displayName = `TourProvider(${platform.name})`;
  return TourProvider;
}

/** Every tour you can start by id: the ones passed to `TourProvider tours`, and every plugin's. */
export function useTours(): readonly Tour[] {
  const { catalog } = useTourContext("useTours");
  return useSyncExternalStore(catalog.subscribe, catalog.get, catalog.get);
}
