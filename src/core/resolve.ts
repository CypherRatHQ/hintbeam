/**
 * Where a step's target is right now — found by measuring, never by remembering:
 *
 *  1. `visible`     — on this screen and in view: point at it;
 *  2. `offscreen`   — on this screen but scrolled away: point to the edge it is past, offer "Show me";
 *  3. `otherScreen` — declared on another screen: point at the link to it if there is one,
 *                     offer "Take me there";
 *  4. `notFound`    — nowhere it can be found: say so and offer Next. It never points at nothing.
 */

import { visibilityOf, type Band, type Box } from "./geometry.js";
import type { ElementRegistry } from "./registry.js";
import type { TourTargets } from "./targets.js";

export interface Highlight {
  box: Box;
  radius: number;
}

export type Where =
  | { kind: "visible"; highlight: Highlight; band: Band | null }
  | { kind: "offscreen"; direction: "up" | "down"; highlight: Highlight; band: Band }
  | { kind: "otherScreen"; screen: string; link: Highlight | null }
  | { kind: "notFound"; reason: "not-drawn" | "not-declared" };

export interface ResolveContext {
  registry: ElementRegistry;
  targets: TourTargets;
  /** The screen in front, as the router names it, or `null` when the app has no router. */
  screen: string | null;
}

export async function resolveTarget(context: ResolveContext, target: string): Promise<Where> {
  const { registry, targets, screen } = context;
  if (!targets.has(target)) return { kind: "notFound", reason: "not-declared" };

  const located = await registry.locate(target, screen);
  if (located) {
    const highlight: Highlight = { box: located.box, radius: located.radius };
    // Something drawn on every screen (a tab button) sits outside the page's scroll area.
    if (located.screen === null) return { kind: "visible", highlight, band: null };
    const band = await registry.scrollArea(screen)?.band();
    if (!band) return { kind: "visible", highlight, band: null };
    const seen = visibilityOf(located.box, band);
    if (seen === "visible") return { kind: "visible", highlight, band };
    return { kind: "offscreen", direction: seen === "above" ? "up" : "down", highlight, band };
  }

  const home = targets.screenOf(target);
  if (home !== null && home !== screen) {
    const link = await registry.locateScreenLink(home);
    return { kind: "otherScreen", screen: home, link: link ? { box: link.box, radius: link.radius } : null };
  }
  return { kind: "notFound", reason: "not-drawn" };
}
