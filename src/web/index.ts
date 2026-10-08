"use client";

/**
 * `hintbeam/web` — React for the browser: Next.js, Vite, Remix, CRA, Expo web.
 * `import … from "hintbeam"` picks this automatically outside React Native.
 */

import { useEffect, useRef, type RefObject } from "react";
import { createTourStorage, type TourStorage } from "../core/progress.js";
import { createTourProvider } from "../react/TourProvider.js";
import { useTourContext } from "../react/context.js";
import { elementScrollArea } from "./dom.js";
import { webPlatform } from "./platform.js";

export * from "../react/index.js";
export { webPlatform } from "./platform.js";
export { GuideOrb, type GuideMood, type GuideOrbProps } from "./StepCard.js";

/** Wrap your app once. See `TourProviderProps` for every option. */
export const TourProvider = createTourProvider(webPlatform);

/**
 * Only for screens that scroll inside their own container rather than the page. The page itself
 * needs nothing. Attach the ref to the scrolling element:
 *
 * ```tsx
 * <div ref={useTourScroll("/settings")} style={{ overflow: "auto" }}>…</div>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTourScroll<T = any>(screen: string): RefObject<T | null> {
  const { registry } = useTourContext("useTourScroll");
  const ref = useRef<T | null>(null);
  useEffect(() => registry.registerScrollArea(screen, elementScrollArea(ref)), [registry, screen]);
  return ref;
}

/**
 * Remember tour progress in the browser's `localStorage`. Safe in server rendering (Next.js):
 * nothing touches `localStorage` until the browser loads or saves progress. Create it once, outside
 * render:
 *
 * ```tsx
 * const storage = browserTourStorage();
 * <TourProvider storage={storage} … />
 * ```
 *
 * If storage is blocked (a private window, a sandboxed frame), progress just isn't kept.
 */
export function browserTourStorage(key?: string): TourStorage {
  const local = () => (typeof window === "undefined" ? null : window.localStorage);
  return createTourStorage(
    {
      getItem: (name) => local()?.getItem(name) ?? null,
      setItem: (name, value) => {
        local()?.setItem(name, value);
      },
    },
    key,
  );
}
