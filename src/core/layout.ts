/**
 * Where the step card sits. Pure, so both renderers place it identically and it is tested once.
 */

import type { Band, Box, Point } from "./geometry.js";

export interface Viewport {
  width: number;
  height: number;
}

export interface CardInsets {
  top: number;
  bottom: number;
  horizontal: number;
}

/**
 * Which side of the target the card sits on (`below`, `above`, `right`, `left`), or which screen
 * edge it is docked to (`top`, `bottom`) when it cannot sit beside the target.
 */
export type CardSide = "below" | "above" | "right" | "left" | "top" | "bottom";

export interface StepPlacement {
  left: number;
  top: number;
  width: number;
  side: CardSide;
  /** The card edge the guide sits on — the one facing the target. */
  edge: "top" | "bottom" | "left" | "right";
  /** The centre of the guide (the orb), where the light leaves from. */
  guide: Point;
}

export interface PlaceOptions {
  insets: CardInsets;
  maxWidth: number;
  /** Space between the target and the card, for the light to travel. */
  gap?: number;
  /** How far along its edge, from the card's corner, the guide sits. */
  guideOffset?: number;
  /** Always dock to a screen edge (phones). Defaults to `true` below 640 wide. */
  dock?: boolean;
}

/**
 * Where the step card goes: beside the target when there is room (below, above, right, left — in
 * that order), docked to a screen edge otherwise. Docked, it sits away from a target that is on
 * screen and toward one that is scrolled away, so the light reaches the edge it is past.
 * Pure, so both renderers place it identically and it is tested once.
 */
export function placeStep(viewport: Viewport, target: Box | null, cardHeight: number, options: PlaceOptions): StepPlacement {
  const { insets, maxWidth, gap = 56, guideOffset = 36 } = options;
  const width = Math.max(0, Math.min(viewport.width - insets.horizontal * 2, maxWidth));
  const minTop = insets.top;
  const maxBottom = viewport.height - insets.bottom;
  const clampLeft = (x: number) => Math.min(Math.max(x, insets.horizontal), viewport.width - insets.horizontal - width);
  const clampTop = (y: number) => Math.min(Math.max(y, minTop), Math.max(minTop, maxBottom - cardHeight));
  /** The guide sits at the end of the edge nearer the target's middle. */
  const along = (left: number, targetX: number) => (targetX <= left + width / 2 ? left + guideOffset : left + width - guideOffset);

  if (!target) {
    const left = clampLeft((viewport.width - width) / 2);
    const top = clampTop(maxBottom - cardHeight);
    return { left, top, width, side: "bottom", edge: "top", guide: { x: left + guideOffset, y: top } };
  }

  const cx = target.x + target.width / 2;
  const cy = target.y + target.height / 2;
  const offAbove = target.y + target.height <= minTop;
  const offBelow = target.y >= maxBottom;
  const dock = options.dock ?? viewport.width < 640;

  if (!dock && !offAbove && !offBelow) {
    const belowTop = target.y + target.height + gap;
    if (belowTop + cardHeight <= maxBottom) {
      const left = clampLeft(cx - width / 2);
      return { left, top: belowTop, width, side: "below", edge: "top", guide: { x: along(left, cx), y: belowTop } };
    }
    const aboveTop = target.y - gap - cardHeight;
    if (aboveTop >= minTop) {
      const left = clampLeft(cx - width / 2);
      return { left, top: aboveTop, width, side: "above", edge: "bottom", guide: { x: along(left, cx), y: aboveTop + cardHeight } };
    }
    const rightLeft = target.x + target.width + gap;
    if (rightLeft + width <= viewport.width - insets.horizontal) {
      const top = clampTop(cy - cardHeight / 2);
      return { left: rightLeft, top, width, side: "right", edge: "left", guide: { x: rightLeft, y: top + guideOffset } };
    }
    const leftLeft = target.x - gap - width;
    if (leftLeft >= insets.horizontal) {
      const top = clampTop(cy - cardHeight / 2);
      return { left: leftLeft, top, width, side: "left", edge: "right", guide: { x: leftLeft + width, y: top + guideOffset } };
    }
  }

  const dockTop = offAbove || (!offBelow && cy > viewport.height / 2);
  const left = clampLeft((viewport.width - width) / 2);
  // Toward a scrolled-away target, leave room between the card and the edge for the light.
  const room = offAbove || offBelow ? gap : 0;
  const top = dockTop ? clampTop(minTop + room) : clampTop(maxBottom - cardHeight - room);
  // The guide faces the target: down from a top card unless the target is above it, and so on.
  const facesDown = dockTop ? !offAbove : offBelow;
  return {
    left,
    top,
    width,
    side: dockTop ? "top" : "bottom",
    edge: facesDown ? "bottom" : "top",
    guide: { x: along(left, cx), y: facesDown ? top + cardHeight : top },
  };
}

/**
 * Where the light ends for a target scrolled out of view: on the screen edge it is past, in line
 * with it, as a small box a path style can point at.
 */
export function edgeBeacon(viewport: Viewport, target: Box, direction: "up" | "down", band?: Band | null, margin = 28): Box {
  const x = Math.min(Math.max(target.x + target.width / 2, margin), viewport.width - margin);
  const y = direction === "up" ? (band?.top ?? 0) : (band?.bottom ?? viewport.height) - 2;
  return { x: x - 1, y, width: 2, height: 2 };
}

/** Whether a point (a tap) is inside a box, with some slack for fingers. */
export function contains(box: Box, point: Point, slack = 4): boolean {
  return (
    point.x >= box.x - slack && point.x <= box.x + box.width + slack && point.y >= box.y - slack && point.y <= box.y + box.height + slack
  );
}
