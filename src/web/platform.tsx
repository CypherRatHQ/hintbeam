"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Point } from "../core/geometry.js";
import type { TourPlatform } from "../react/platform.js";
import { domMeasurable, windowScrollArea } from "./dom.js";
import { WebStepCard } from "./StepCard.js";

const TAP_SLOP = 10;

/** Reports clicks and taps anywhere on the page, in the capture phase, without stopping them. */
function TapObserver({ onTap, children }: { onTap(point: Point): void; children: ReactNode }) {
  const latest = useRef(onTap);
  latest.current = onTap;
  useEffect(() => {
    let down: Point | null = null;
    const onDown = (event: PointerEvent) => {
      down = { x: event.clientX, y: event.clientY };
    };
    const onUp = (event: PointerEvent) => {
      if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) <= TAP_SLOP)
        latest.current({ x: event.clientX, y: event.clientY });
      down = null;
    };
    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    document.addEventListener("pointerup", onUp, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown, { capture: true });
      document.removeEventListener("pointerup", onUp, { capture: true });
    };
  }, []);
  return <>{children}</>;
}

function useLayoutChanges(invalidate: () => void) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settled = () => {
      clearTimeout(timer);
      timer = setTimeout(invalidate, 120);
    };
    window.addEventListener("resize", settled);
    window.addEventListener("scroll", settled, { capture: true, passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", settled);
      window.removeEventListener("scroll", settled, { capture: true });
    };
  }, [invalidate]);
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

function useKeyboard({ next, back, skip, active }: { next(): void; back(): void; skip(): void; active: boolean }) {
  const latest = useRef({ next, back, skip });
  latest.current = { next, back, skip };
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") latest.current.skip();
      else if (event.key === "ArrowRight") latest.current.next();
      else if (event.key === "ArrowLeft") latest.current.back();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
}

export const webPlatform: TourPlatform = {
  name: "web",
  measurable: domMeasurable,
  defaultScrollArea: () => (typeof window === "undefined" ? null : windowScrollArea()),
  TapObserver,
  StepUI: WebStepCard,
  useLayoutChanges,
  useKeyboard,
};
