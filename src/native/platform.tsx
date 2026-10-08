import { useEffect, useRef, type ReactNode } from "react";
import { Dimensions, StyleSheet, View, type GestureResponderEvent } from "react-native";
import type { Point } from "../core/geometry.js";
import type { TourPlatform } from "../react/platform.js";
import { measurableRef } from "./measure.js";
import { NativeStepCard } from "./StepCard.js";

const TAP_SLOP = 10;

/** Watches touches in the capture phase and reports taps. Never claims or blocks a touch. */
function TapObserver({ onTap, children }: { onTap(point: Point): void; children: ReactNode }) {
  const down = useRef<Point | null>(null);
  // Runs on every touch start, outermost first; returning false means it never claims the touch.
  const start = (event: GestureResponderEvent) => {
    down.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
    return false;
  };
  const end = (event: GestureResponderEvent) => {
    const from = down.current;
    down.current = null;
    const point = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
    if (from && Math.hypot(point.x - from.x, point.y - from.y) <= TAP_SLOP) onTap(point);
  };
  return (
    <View style={styles.fill} onStartShouldSetResponderCapture={start} onTouchEndCapture={end}>
      {children}
    </View>
  );
}

function useLayoutChanges(invalidate: () => void) {
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", invalidate);
    return () => subscription.remove();
  }, [invalidate]);
}

export const nativePlatform: TourPlatform = {
  name: "native",
  measurable: measurableRef,
  TapObserver,
  StepUI: NativeStepCard,
  useLayoutChanges,
};

const styles = StyleSheet.create({ fill: { flex: 1 } });
