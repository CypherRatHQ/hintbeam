/**
 * Path styles: how the light travels from the step card to the target. Each style is a pure
 * function from a start point and a target box to a `Route`; every renderer draws any route the
 * same way, so a new style is one function — add your own with `defineTourPath`, or from a plugin.
 */

import { edgeNormal, meetPoint, type Box, type Point, type PathRoute } from "./geometry.js";

export interface TourPathOptions {
  /** Leave the start this far out, so a glow there is not drawn over. */
  gap?: number;
  /**
   * The direction to leave the start in — out of the card edge the light starts on, so it never
   * curls back over the card. Any length; only the direction counts. Default: toward the target.
   */
  leave?: Point;
  /** How many evenly spaced points to sample (for anything travelling the route). */
  samples?: number;
}

export type TourPath = (from: Point, to: Box, options?: TourPathOptions) => PathRoute;

type Cubic = readonly [Point, Point, Point]; // control 1, control 2, end

const DEFAULT_SAMPLES = 24;

function bezier(p0: Point, [p1, p2, p3]: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const line = (from: Point, to: Point): Cubic => [lerp(from, to, 1 / 3), lerp(from, to, 2 / 3), to];
const round = (n: number) => Number(n.toFixed(2));

/** A route through cubic segments, with points evenly spaced by arc length. */
export function routeThrough(start: Point, segments: readonly Cubic[], samples = DEFAULT_SAMPLES): PathRoute {
  const dense: Point[] = [start];
  let from = start;
  for (const segment of segments) {
    for (let i = 1; i < 60; i += 1) dense.push(bezier(from, segment, i / 60));
    dense.push(segment[2]);
    from = segment[2];
  }
  const cumulative = [0];
  for (let i = 1; i < dense.length; i += 1) {
    cumulative.push(cumulative[i - 1]! + Math.hypot(dense[i]!.x - dense[i - 1]!.x, dense[i]!.y - dense[i - 1]!.y));
  }
  const length = cumulative[cumulative.length - 1]!;
  const count = Math.max(2, samples);
  const points: Point[] = [];
  let j = 1;
  for (let i = 0; i < count; i += 1) {
    const want = (length * i) / (count - 1);
    while (j < cumulative.length - 1 && cumulative[j]! < want) j += 1;
    const before = cumulative[j - 1]!;
    const after = cumulative[j]!;
    points.push(lerp(dense[j - 1]!, dense[j]!, after === before ? 0 : (want - before) / (after - before)));
  }
  points[count - 1] = from; // exactly on the end, not a rounding error away
  const d =
    `M ${round(start.x)} ${round(start.y)}` +
    segments
      .map(([c1, c2, end]) => ` C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(end.x)} ${round(end.y)}`)
      .join("");
  return { d, start, end: from, length, points };
}

const unit = (p: Point): Point => {
  const length = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / length, y: p.y / length };
};
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));

function startPoint(from: Point, end: Point, gap = 0, leave?: Point): Point {
  if (gap <= 0) return from;
  const direction = unit(leave ?? { x: end.x - from.x, y: end.y - from.y });
  return { x: from.x + direction.x * gap, y: from.y + direction.y * gap };
}

/**
 * What every curved style shares: where it starts and ends, which way it leaves (out of the card)
 * and arrives (square onto the target's edge), and how far it keeps each direction — the connector
 * curve diagrams use — so the light is a smooth S at any angle, never a hook.
 */
function frame(from: Point, to: Box, options: TourPathOptions) {
  const end = meetPoint(from, to);
  const start = startPoint(from, end, options.gap, options.leave);
  const leave = unit(options.leave ?? { x: end.x - start.x, y: end.y - start.y });
  const arrive = edgeNormal(end, to, start);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / distance, y: dx / distance };
  // Bend toward the side the light leaves on, so it never swings back over its own card.
  const facing = normal.x * leave.x + normal.y * leave.y;
  const side = Math.abs(facing) > 0.05 ? Math.sign(facing) : dx >= 0 ? 1 : -1;
  // Reach: half the distance along each end's direction, plus some of the distance across it, so
  // a light that must travel sideways turns gradually instead of all at once.
  const reach = (d: Point) => {
    const alongIt = Math.abs(dx * d.x + dy * d.y);
    const across = Math.abs(dx * d.y - dy * d.x);
    return alongIt * 0.5 + across * 0.3;
  };
  const out = clamp(reach(leave), 8, 240);
  const into = clamp(reach(arrive), 8, 220);
  return { start, end, leave, arrive, distance, normal, side, out, into };
}

const along = (p: Point, d: Point, k: number): Point => ({ x: p.x + d.x * k, y: p.y + d.y * k });

/** A soft S-curve: leaves its card straight, and meets the target square on — the signature look. */
export const wave: TourPath = (from, to, options = {}) => {
  const { start, end, leave, arrive, out, into } = frame(from, to, options);
  return routeThrough(start, [[along(start, leave, out), along(end, arrive, into), end]], options.samples);
};

/** The shortest line. Calm, and the clearest on busy screens. */
export const straight: TourPath = (from, to, options = {}) => {
  const end = meetPoint(from, to);
  const start = startPoint(from, end, options.gap, options.leave);
  return routeThrough(start, [line(start, end)], options.samples);
};

/** Vertical, then horizontal into the target's side, with a rounded corner — reads like a diagram. */
export const elbow: TourPath = (from, to, options = {}) => {
  const middleY = to.y + to.height / 2;
  // Straight below or above the target: there is no corner to turn, so go straight in.
  if (from.x >= to.x && from.x <= to.x + to.width) return straight(from, to, options);
  const end = { x: from.x < to.x ? to.x : to.x + to.width, y: middleY };
  const start = startPoint(from, { x: from.x, y: end.y }, options.gap);
  const corner = { x: start.x, y: end.y };
  const r = Math.min(16, Math.abs(end.y - start.y) / 2, Math.abs(end.x - start.x) / 2);
  if (r < 1) return routeThrough(start, [line(start, end)], options.samples);
  const sy = Math.sign(end.y - start.y) || 1;
  const sx = Math.sign(end.x - start.x) || 1;
  const beforeCorner = { x: corner.x, y: corner.y - sy * r };
  const afterCorner = { x: corner.x + sx * r, y: corner.y };
  return routeThrough(
    start,
    [line(start, beforeCorner), [lerp(beforeCorner, corner, 0.55), lerp(afterCorner, corner, 0.55), afterCorner], line(afterCorner, end)],
    options.samples,
  );
};

/** One generous arc — playful, good for long distances. */
export const arc: TourPath = (from, to, options = {}) => {
  const { start, end, leave, arrive, distance, normal, side, out, into } = frame(from, to, options);
  const bulge = distance * 0.2 * side;
  return routeThrough(
    start,
    [[along(along(start, leave, out), normal, bulge), along(along(end, arrive, into), normal, bulge * 0.4), end]],
    options.samples,
  );
};

/** How far the companion strands fan out from the main one, at most. */
const FAN = 14;

/**
 * Three lines of light: the wave, with two fainter strands fanned out to either side that leave
 * a little apart and gather at the target — the most magical of the styles.
 */
export const strands: TourPath = (from, to, options = {}) => {
  const { start, end, leave, arrive, distance, out, into } = frame(from, to, options);
  // Companions leave a little apart along the card edge, fan gently, and meet the main line only at
  // the target.
  const across = { x: -leave.y, y: leave.x };
  const acrossEnd = { x: -arrive.y, y: arrive.x };
  const spread = Math.min(FAN, distance * 0.07);
  const build = (fan: number): [Point, Cubic] => {
    const s = along(start, across, fan * 4);
    return [s, [along(along(s, leave, out), across, fan * spread), along(along(end, arrive, into), acrossEnd, -fan * spread * 0.6), end]];
  };
  const [mainStart, main] = build(0);
  const route = routeThrough(mainStart, [main], options.samples);
  const companions = [-1, 1].map((fan) => {
    const [s, curve] = build(fan);
    const { d, length } = routeThrough(s, [curve], 2);
    return { d, length };
  });
  return { ...route, strands: companions };
};

/** The built-in styles. `"wave"` is the default. */
export const TOUR_PATHS = { wave, strands, straight, elbow, arc } as const;

export type TourPathName = keyof typeof TOUR_PATHS;

/** Name a custom style so `TourProvider path="…"` and plugins can use it. Returns it unchanged. */
export function defineTourPath<S extends TourPath>(style: S): S {
  return style;
}
