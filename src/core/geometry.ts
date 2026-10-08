/**
 * Pure geometry over measured boxes. No screen, no platform: the renderer measures, this decides.
 */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** The vertical band of a screen that is actually visible (below the header, above the tab bar). */
export interface Band {
  top: number;
  bottom: number;
}

export type Visibility = "visible" | "above" | "below";

/** On screen enough to point at: at least `share` of the box (or of the band, if smaller) is inside the band. */
export function visibilityOf(box: Box, band: Band, share = 0.6): Visibility {
  const top = Math.max(box.y, band.top);
  const bottom = Math.min(box.y + box.height, band.bottom);
  const visible = Math.max(0, bottom - top);
  const needed = Math.min(box.height, band.bottom - band.top) * share;
  if (visible > 0 && visible >= needed) return "visible";
  return box.y + box.height / 2 < band.top ? "above" : "below";
}

/** The scroll offset that puts the box a comfortable way down the band. */
export function scrollToShow(box: Box, band: Band, scrollY: number, margin = 24): number {
  const height = band.bottom - band.top;
  const fits = box.height + margin * 2 <= height;
  const wanted = fits ? box.y - band.top - (height - box.height) / 3 : box.y - band.top - margin;
  return Math.max(0, scrollY + wanted);
}

export function center(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** The middle of the target's edge that faces the origin. */
export function nearEdge(origin: Point, target: Box): Point {
  if (origin.y < target.y) return { x: target.x + target.width / 2, y: target.y };
  if (origin.y > target.y + target.height) return { x: target.x + target.width / 2, y: target.y + target.height };
  if (origin.x < target.x) return { x: target.x, y: target.y + target.height / 2 };
  if (origin.x > target.x + target.width) return { x: target.x + target.width, y: target.y + target.height / 2 };
  return center(target);
}

/**
 * Where a light from `origin` meets the target: on the edge facing the origin, at the point nearest
 * the origin — but within the middle half of that edge, so it still plainly points at the element.
 * Wide targets get short, calm lights instead of long ones to their middle.
 */
export function meetPoint(origin: Point, target: Box): Point {
  const within = (value: number, start: number, size: number) => Math.min(start + size * 0.75, Math.max(start + size * 0.25, value));
  if (origin.y < target.y) return { x: within(origin.x, target.x, target.width), y: target.y };
  if (origin.y > target.y + target.height) return { x: within(origin.x, target.x, target.width), y: target.y + target.height };
  if (origin.x < target.x) return { x: target.x, y: within(origin.y, target.y, target.height) };
  if (origin.x > target.x + target.width) return { x: target.x + target.width, y: within(origin.y, target.y, target.height) };
  return center(target);
}

/**
 * The outward direction of the box edge a point sits on (unit length): which way a line should
 * arrive to meet that edge square on. For a point inside the box, the way back toward `from`.
 */
export function edgeNormal(point: Point, box: Box, from?: Point): Point {
  const distances = [
    { d: Math.abs(point.y - box.y), n: { x: 0, y: -1 } },
    { d: Math.abs(point.y - (box.y + box.height)), n: { x: 0, y: 1 } },
    { d: Math.abs(point.x - box.x), n: { x: -1, y: 0 } },
    { d: Math.abs(point.x - (box.x + box.width)), n: { x: 1, y: 0 } },
  ].sort((a, b) => a.d - b.d);
  if (distances[0]!.d < 0.5) return distances[0]!.n;
  if (from) {
    const dx = from.x - point.x;
    const dy = from.y - point.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }
  return distances[0]!.n;
}

/** A box grown by `by` on every side — the ring drawn around a target. */
export function inflate(box: Box, by: number): Box {
  return { x: box.x - by, y: box.y - by, width: box.width + by * 2, height: box.height + by * 2 };
}

/** One extra line drawn beside a route's main one. */
export interface Strand {
  d: string;
  length: number;
}

/** A drawn path from the step card to the target. Made by a path style (`paths.ts`). */
export interface PathRoute {
  /** SVG path data from the start to the target's near edge. */
  d: string;
  start: Point;
  end: Point;
  /** Arc length, for drawing the path on with a dash. */
  length: number;
  /** Evenly spaced points along the route, for anything that travels it. */
  points: Point[];
  /** Fainter companion lines beside the main one, meeting it at the target (the `strands` style). */
  strands?: readonly Strand[];
}
