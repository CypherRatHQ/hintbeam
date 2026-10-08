/**
 * `hintbeam/native` — React Native and Expo (iOS, Android).
 * `import … from "hintbeam"` picks this automatically in React Native.
 */

import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";
import type { ScrollArea } from "../core/registry.js";
import { useTourContext } from "../react/context.js";
import { createTourProvider } from "../react/TourProvider.js";
import { measurableRef } from "./measure.js";
import { nativePlatform } from "./platform.js";

export * from "../react/index.js";
export { GuideOrb, type GuideOrbProps } from "./GuideOrb.js";
export { nativePlatform } from "./platform.js";

/** Wrap your app once. See `TourProviderProps` for every option. */
export const TourProvider = createTourProvider(nativePlatform);

export interface TourScrollProps {
  ref: RefObject<ScrollView | null>;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd: () => void;
  onScrollEndDrag: () => void;
  scrollEventThrottle: number;
}

/**
 * Let tours see and scroll a screen's main ScrollView, so a step can offer "Show me" for a target
 * scrolled out of view. Spread it onto the ScrollView:
 *
 * ```tsx
 * <ScrollView {...useTourScroll("/food")}>…</ScrollView>
 * ```
 *
 * Already handle `onScroll`? Call the returned `onScroll` from your own handler.
 */
export function useTourScroll(screen: string): TourScrollProps {
  const { registry, invalidate } = useTourContext("useTourScroll");
  const ref = useRef<ScrollView | null>(null);
  const offset = useRef(0);

  useEffect(() => {
    const measurable = measurableRef(ref);
    const area: ScrollArea = {
      band: async () => {
        const box = await measurable.measure();
        return box ? { top: box.y, bottom: box.y + box.height } : null;
      },
      offset: () => offset.current,
      scrollTo: (y) => ref.current?.scrollTo({ y, animated: true }),
    };
    return registry.registerScrollArea(screen, area);
  }, [registry, screen]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);
  return useMemo(
    () => ({ ref, onScroll, onMomentumScrollEnd: invalidate, onScrollEndDrag: invalidate, scrollEventThrottle: 16 }),
    [onScroll, invalidate],
  );
}
