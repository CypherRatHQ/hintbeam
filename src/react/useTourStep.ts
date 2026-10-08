import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { scrollToShow, type Box } from "../core/geometry.js";
import type { TourState } from "../core/player.js";
import { resolveTarget, type Where } from "../core/resolve.js";
import { useTourContext } from "./context.js";
import type { TourLabels } from "./labels.js";

const isDev = typeof process !== "undefined" ? process.env?.["NODE_ENV"] !== "production" : true;
const warned = new Set<string>();

/** Wait this long after a change before measuring, so screens and scrolls have settled. */
const SETTLE_MS = 60;

export interface TourStepView extends TourState {
  /** Where the current step's target is right now, or `null` while it is being found. */
  where: Where | null;
  /** The box to highlight: the target, or the link to its screen. */
  highlight: { box: Box; radius: number } | null;
  labels: TourLabels;
  /**
   * The main button for this step: "next" or "done"; "showMe" when the target is scrolled away;
   * "takeMeThere" when it is on another screen; "wait" while a tap or event step waits for the user.
   */
  primary: "next" | "done" | "showMe" | "takeMeThere" | "wait";
  next(): void;
  back(): void;
  skip(): void;
  /** Scroll the target into view. */
  showMe(): void;
  /** Go to the target's screen. */
  takeMeThere(): void;
  /** Find the target again — after your own layout change, for example. */
  refresh(): void;
  /**
   * Measure the highlighted element where it is this instant, without finding it again — for a UI
   * that follows it while the page scrolls. `null` when there is nothing highlighted.
   */
  track(): Promise<Box | null>;
  /** Changes when the step changes (tour and index), for keying animations. `null` with no step. */
  key: string | null;
}

/**
 * Everything the built-in step card uses — for building your own. Render
 * `<TourProvider renderStep={(step) => <MyCard step={step} />}>`, or `renderStep={null}` and call
 * this hook anywhere.
 */
export function useTourStep(): TourStepView {
  const { player, registry, targets, router, labels, subscribeInvalidate } = useTourContext("useTourStep");
  const state = useSyncExternalStore(player.subscribe, player.getState, player.getState);
  const [where, setWhere] = useState<Where | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => subscribeInvalidate(refresh), [subscribeInvalidate, refresh]);
  useEffect(() => router.subscribe(refresh), [router, refresh]);

  const target = state.step?.target ?? null;
  const run = useRef(0);
  // "Take me there" means take me to the thing: if the target turns out to be scrolled away on
  // arrival, scroll it into view too instead of asking for a second click.
  const revealOnArrival = useRef(false);
  // A new step must never show the previous step's position, even for a frame.
  const stepKey = state.tour ? `${state.tour.id}#${state.index}` : null;
  const shownFor = useRef<string | null>(null);
  useEffect(() => {
    if (target === null) {
      setWhere(null);
      return;
    }
    if (shownFor.current !== stepKey) {
      shownFor.current = stepKey;
      setWhere(null);
    }
    const id = ++run.current;
    const timer = setTimeout(() => {
      const screen = router.currentScreen();
      void resolveTarget({ registry, targets, screen }, target).then((found) => {
        if (id !== run.current) return;
        if (revealOnArrival.current && found.kind !== "otherScreen") {
          revealOnArrival.current = false;
          if (found.kind === "offscreen") {
            const area = registry.scrollArea(screen);
            if (area) {
              area.scrollTo(scrollToShow(found.highlight.box, found.band, area.offset()));
              setTimeout(refresh, 450);
            }
          }
        }
        setWhere(found);
        if (isDev && found.kind === "notFound" && found.reason === "not-drawn" && !warned.has(target)) {
          warned.add(target);
          console.warn(
            `hintbeam: step target "${target}" is not on screen${screen ? ` ${screen}` : ""}. ` +
              `Attach useTarget("${target}") to an element there, or check its "screen" in defineTargets().`,
          );
        }
      });
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [registry, targets, router, target, stepKey, tick, refresh]);

  const showMe = useCallback(() => {
    if (where?.kind !== "offscreen") return;
    const area = registry.scrollArea(router.currentScreen());
    if (!area) return;
    area.scrollTo(scrollToShow(where.highlight.box, where.band, area.offset()));
    setTimeout(refresh, 450);
  }, [where, registry, router, refresh]);

  const takeMeThere = useCallback(() => {
    if (where?.kind !== "otherScreen") return;
    revealOnArrival.current = true;
    void Promise.resolve(router.navigate(where.screen)).then(() => setTimeout(refresh, 450));
  }, [where, router, refresh]);

  const current = state.step ? where : null;
  const highlight =
    current?.kind === "visible" || current?.kind === "offscreen"
      ? current.highlight
      : current?.kind === "otherScreen"
        ? current.link
        : null;
  const track = useCallback(async (): Promise<Box | null> => {
    if (!current || target === null) return null;
    if (current.kind === "visible" || current.kind === "offscreen")
      return (await registry.locate(target, router.currentScreen()))?.box ?? null;
    if (current.kind === "otherScreen" && current.link) return (await registry.locateScreenLink(current.screen))?.box ?? null;
    return null;
  }, [current, target, registry, router]);

  const advance = state.step?.advanceOn ?? "next";
  const waits = (advance === "tap" || typeof advance === "object") && !state.waitedTooLong && current?.kind === "visible";
  const primary: TourStepView["primary"] =
    current?.kind === "offscreen"
      ? "showMe"
      : current?.kind === "otherScreen"
        ? "takeMeThere"
        : waits
          ? "wait"
          : state.isLast
            ? "done"
            : "next";

  return {
    ...state,
    where: current,
    highlight,
    labels,
    primary,
    next: () => player.next(),
    back: () => player.back(),
    skip: () => player.skip(),
    showMe,
    takeMeThere,
    refresh,
    track,
    key: stepKey,
  };
}
