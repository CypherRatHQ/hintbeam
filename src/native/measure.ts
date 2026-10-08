import type { Box } from "../core/geometry.js";
import type { Measurable } from "../core/registry.js";

/** The part of a React Native host view (or react-native-web element) we need. */
export interface MeasurableView {
  measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}

/** A `Measurable` over a ref, read when asked — never a remembered position. */
export function measurableRef(ref: { readonly current: unknown }): Measurable {
  return {
    measure: () =>
      new Promise<Box | null>((resolve) => {
        const view = ref.current as Partial<MeasurableView> | null;
        if (!view || typeof view.measureInWindow !== "function") {
          resolve(null);
          return;
        }
        try {
          view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
        } catch {
          resolve(null);
        }
      }),
  };
}
