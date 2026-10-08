import type { Box } from "../core/geometry.js";
import type { Measurable, ScrollArea } from "../core/registry.js";

type Elementish = { getBoundingClientRect?: () => DOMRect; getScrollableNode?: () => unknown };

/** The DOM element behind a ref — a plain element, or a react-native-web host. */
export function elementOf(value: unknown): Element | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Elementish;
  if (typeof candidate.getBoundingClientRect === "function") return value as Element;
  return null;
}

export function boxOf(element: Element): Box | null {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  // Something hidden with display/visibility does not count as drawn.
  const style = typeof window !== "undefined" ? window.getComputedStyle(element) : null;
  if (style && (style.visibility === "hidden" || style.display === "none")) return null;
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

export function domMeasurable(ref: { readonly current: unknown }): Measurable {
  return {
    measure: async () => {
      const element = elementOf(ref.current);
      return element ? boxOf(element) : null;
    },
  };
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The page itself as a scroll area — what every screen uses unless it registers its own. */
export function windowScrollArea(): ScrollArea {
  return {
    band: async () => (typeof window === "undefined" ? null : { top: 0, bottom: window.innerHeight }),
    offset: () => (typeof window === "undefined" ? 0 : window.scrollY),
    scrollTo: (top) => window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" }),
  };
}

/** A scrolling element as a scroll area. Accepts react-native-web ScrollView refs too. */
export function elementScrollArea(ref: { readonly current: unknown }): ScrollArea {
  const node = (): HTMLElement | null => {
    const current = ref.current as Elementish | null;
    const scrollable = typeof current?.getScrollableNode === "function" ? current.getScrollableNode() : current;
    return (elementOf(scrollable) as HTMLElement | null) ?? null;
  };
  return {
    band: async () => {
      const element = node();
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: Math.max(0, rect.top), bottom: Math.min(window.innerHeight, rect.bottom) };
    },
    offset: () => node()?.scrollTop ?? 0,
    scrollTo: (top) => node()?.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" }),
  };
}

export { prefersReducedMotion };
