import type { ComponentType, ReactNode } from "react";
import type { Point } from "../core/geometry.js";
import type { TourPath } from "../core/paths.js";
import type { Measurable, ScrollArea } from "../core/registry.js";
import type { TourTheme } from "./theme.js";
import type { TourStepView } from "./useTourStep.js";

export interface TourStepUIProps {
  view: TourStepView;
  theme: TourTheme;
  path: TourPath;
}

/**
 * Everything that differs between platforms. `hintbeam/web` and `hintbeam/native` each
 * provide one; a new platform (Vue, Svelte, Flutter web, a canvas) is a new implementation of this
 * interface over the same core.
 */
export interface TourPlatform {
  name: string;
  /** Measure an element held by a ref, in viewport coordinates. */
  measurable(ref: { readonly current: unknown }): Measurable;
  /** The scroll area for screens that did not register one (the page itself, on the web). */
  defaultScrollArea?(): ScrollArea | null;
  /** Wraps the app and reports taps without ever blocking them. */
  TapObserver: ComponentType<{ onTap(point: Point): void; children: ReactNode }>;
  /** The built-in step card and light. */
  StepUI: ComponentType<TourStepUIProps>;
  /** Call `invalidate` whenever the layout may have moved (resize, rotation). */
  useLayoutChanges(invalidate: () => void): void;
  /** Keyboard shortcuts while a step is showing. */
  useKeyboard?(actions: { next(): void; back(): void; skip(): void; active: boolean }): void;
}
