"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { inflate, type Box, type Point, type PathRoute } from "../core/geometry.js";
import { edgeBeacon, placeStep, type StepPlacement } from "../core/layout.js";
import type { TourStepUIProps } from "../react/platform.js";
import type { TourTheme } from "../react/theme.js";
import type { TourStepView } from "../react/useTourStep.js";
import { prefersReducedMotion } from "./dom.js";

const STYLE_ID = "hintbeam-style";
/** How long the light takes to draw from the guide to the target. */
const DRAW_MS = 720;
/** The guide's own size, and the socket on the card edge it sits in. */
const ORB = 34;
const SOCKET = 42;
/** How far outside the target its highlight ring is drawn. The light ends on the ring, not under it. */
const RING = 6;
/** Which way the light leaves each card edge: straight out of it. */
const OUT_OF: Record<StepPlacement["edge"], Point> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const CSS = `
@keyframes hb-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes hb-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes hb-travel { 0% { offset-distance: 0%; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
@keyframes hb-ripple { 0% { opacity: .7; transform: scale(1); } 100% { opacity: 0; transform: scale(1.18); } }
@keyframes hb-pulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes hb-card-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes hb-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes hb-word { from { opacity: 0; filter: blur(5px); transform: translateY(3px); } to { opacity: 1; filter: none; transform: none; } }
@keyframes hb-breathe { 0%, 100% { transform: scale(.9); opacity: .7; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes hb-spin { to { transform: rotate(360deg); } }
@keyframes hb-nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--hb-nudge, 4px)); } }
@keyframes hb-dot { 0%, 100% { opacity: .35; transform: scale(.75); } 50% { opacity: 1; transform: scale(1); } }

.hb-layer { position: fixed; inset: 0; pointer-events: none; }
.hb-card {
  position: absolute; box-sizing: border-box; pointer-events: auto;
  font-family: var(--hb-font); color: var(--hb-text); background: var(--hb-card);
  border-radius: var(--hb-radius); border: 1px solid var(--hb-border);
  -webkit-backdrop-filter: blur(20px) saturate(1.6); backdrop-filter: blur(20px) saturate(1.6);
  box-shadow: 0 1px 0 0 rgba(255,255,255,.08) inset, 0 30px 70px -18px rgba(8,4,32,.45), 0 10px 24px -12px rgba(8,4,32,.25), 0 0 0 1px rgba(0,0,0,.02);
  padding: 16px 16px 14px; -webkit-font-smoothing: antialiased; text-align: left;
}
.hb-card[data-edge="top"] { padding-top: 24px; }
.hb-card[data-edge="bottom"] { padding-bottom: 24px; }
.hb-card[data-move="glide"] { transition: left .42s cubic-bezier(.2,.8,.2,1), top .42s cubic-bezier(.2,.8,.2,1); }
.hb-card[data-enter="full"] { animation: hb-card-in .26s cubic-bezier(.2,.8,.2,1) both; }
.hb-card[data-enter="calm"] { animation: hb-fade .2s ease-out both; }
.hb-card::after { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none; box-shadow: 0 0 calc(32px * var(--hb-glow)) -12px var(--hb-accent); opacity: calc(.6 * var(--hb-glow)); }
.hb-card::before {
  content: ""; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; pointer-events: none;
  background: linear-gradient(140deg, var(--hb-accent), transparent 38%, transparent 70%, var(--hb-accent2));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: calc(.12 + .45 * var(--hb-glow));
}
.hb-head { display: flex; align-items: center; gap: 10px; min-height: 28px; }
.hb-progress { display: flex; gap: 4px; flex: 1; align-items: center; }
.hb-seg { height: 4px; width: 12px; border-radius: 99px; background: var(--hb-muted); opacity: .25; transition: width .3s, opacity .3s, background .3s; }
.hb-seg[data-done] { opacity: .6; background: var(--hb-accent); }
.hb-seg[data-now] { width: 24px; opacity: 1; background: linear-gradient(90deg, var(--hb-accent), var(--hb-accent2)); }
.hb-count { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--hb-muted); letter-spacing: .02em; }
.hb-title { margin: 8px 0 0; font-size: 16px; line-height: 22px; font-weight: 650; letter-spacing: -.01em; color: var(--hb-text); }
.hb-text { margin: 6px 0 0; font-size: 14px; line-height: 21px; color: var(--hb-text); opacity: .86; }
.hb-head + .hb-text { margin-top: 10px; }
.hb-note { display: flex; gap: 8px; align-items: center; margin: 10px 0 0; padding: 8px 10px; border-radius: 10px; font-size: 13px; color: var(--hb-muted); background: color-mix(in srgb, var(--hb-muted) 10%, transparent); }
.hb-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 14px; }
.hb-turn { display: inline-flex; align-items: center; gap: 7px; margin-right: 6px; font-size: 12.5px; font-weight: 600; color: var(--hb-accent); }
.hb-turn i { width: 7px; height: 7px; border-radius: 99px; background: var(--hb-accent); box-shadow: 0 0 10px var(--hb-accent); animation: hb-dot 1.4s ease-in-out infinite; }
.hb-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.hb-skip { margin-left: -8px; padding: 0 8px; min-width: 0; font-weight: 500; font-size: 13px; opacity: .8; }
.hb-skip:hover { opacity: 1; }
.hb-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; min-width: 44px; padding: 0 12px; border-radius: 10px; border: 0; background: transparent; color: var(--hb-muted); font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s, color .15s, transform .15s, box-shadow .15s; }
.hb-button:hover { color: var(--hb-text); background: color-mix(in srgb, var(--hb-muted) 12%, transparent); }
.hb-button:focus-visible { outline: 2px solid var(--hb-accent); outline-offset: 2px; }
.hb-primary { color: var(--hb-on-accent); padding: 0 14px; background: linear-gradient(135deg, var(--hb-accent), var(--hb-accent2)); box-shadow: 0 1px 0 rgba(255,255,255,.25) inset, 0 4px calc(6px + 12px * var(--hb-glow)) -6px var(--hb-accent); }
.hb-primary:hover { color: var(--hb-on-accent); background: linear-gradient(135deg, var(--hb-accent), var(--hb-accent2)); transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,.25) inset, 0 6px calc(10px + 14px * var(--hb-glow)) -8px var(--hb-accent); }
.hb-word { display: inline-block; white-space: pre; animation: hb-word .42s cubic-bezier(.2,.8,.2,1) both; }
.hb-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.hb-socket { position: absolute; width: ${SOCKET}px; height: ${SOCKET}px; margin: -${SOCKET / 2}px 0 0 -${SOCKET / 2}px; border-radius: 99px; display: grid; place-items: center; background: var(--hb-card); border: 1px solid var(--hb-border); box-shadow: 0 0 calc(14px * var(--hb-glow)) -4px var(--hb-accent); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); transition: left .42s cubic-bezier(.2,.8,.2,1), top .42s cubic-bezier(.2,.8,.2,1); }
.hb-orb { overflow: visible; }
.hb-orb .hb-halo { transform-origin: center; transform-box: fill-box; animation: hb-breathe 3.2s ease-in-out infinite; }
/* The orb is drawn around (0, 0) of its viewBox, so its parts turn about that point. */
.hb-orb .hb-ring { transform-origin: 0 0; transform-box: view-box; animation: hb-spin 9s linear infinite; }
.hb-orb .hb-orbit { transform-origin: 0 0; transform-box: view-box; animation: hb-spin 3.4s linear infinite; }
.hb-orb .hb-orbit2 { transform-origin: 0 0; transform-box: view-box; animation: hb-spin 5.6s linear infinite reverse; }
.hb-orb[data-mood="wait"] .hb-halo { animation-duration: 1.6s; }
.hb-orb[data-mood="search"] .hb-ring { animation-duration: 1.4s; }
.hb-orb[data-mood="search"] .hb-core { opacity: .55; }
.hb-orb[data-mood="done"] .hb-halo { animation-duration: 2.2s; }
.hb-orb .hb-lean { transform-origin: 0 0; transform-box: view-box; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
@media (prefers-reduced-motion: reduce) {
  .hb-card, .hb-card *, .hb-socket, .hb-layer * { animation: none !important; transition: none !important; }
}
`;

function useStyleSheet() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }, []);
}

function useViewport() {
  const read = () => ({ width: window.innerWidth, height: window.innerHeight });
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const update = () => setViewport(read());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return viewport;
}

/**
 * The highlighted box, followed every frame while anything scrolls, so the light and the card
 * move with the page instead of breaking off until the step is measured again.
 */
function useLiveBox(view: TourStepView): { box: Box | null; scrolling: boolean } {
  const base = view.highlight?.box ?? null;
  const [tracked, setTracked] = useState<{ base: Box | null; box: Box } | null>(null);
  const [scrolling, setScrolling] = useState(false);
  const latest = useRef({ track: view.track, base });
  latest.current = { track: view.track, base };

  useEffect(() => {
    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onMove = () => {
      setScrolling(true);
      clearTimeout(idle);
      idle = setTimeout(() => setScrolling(false), 180);
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const { track, base: from } = latest.current;
        void track().then((box) => {
          if (box && latest.current.base === from) setTracked({ base: from, box });
        });
      });
    };
    window.addEventListener("scroll", onMove, { capture: true, passive: true });
    window.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    };
  }, []);

  return { box: tracked && tracked.base === base ? tracked.box : base, scrolling };
}

/** The built-in step card, guide and light for the web. Rendered in a portal on `document.body`. */
export function WebStepCard({ view, theme, path }: TourStepUIProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !view.step) return null;
  return createPortal(<Overlay view={view} theme={theme} path={path} />, document.body);
}

function themeVars(theme: TourTheme): CSSProperties {
  return {
    ["--hb-accent" as string]: theme.accent,
    ["--hb-accent2" as string]: theme.accent2,
    ["--hb-on-accent" as string]: theme.onAccent,
    ["--hb-card" as string]: theme.card,
    ["--hb-border" as string]: theme.border,
    ["--hb-text" as string]: theme.text,
    ["--hb-muted" as string]: theme.mutedText,
    ["--hb-radius" as string]: `${theme.radius}px`,
    ["--hb-font" as string]: theme.fontFamily ?? "inherit",
    ["--hb-glow" as string]: String(theme.glow),
  };
}

function Overlay({ view, theme, path }: TourStepUIProps) {
  useStyleSheet();
  const viewport = useViewport();
  const motion = prefersReducedMotion() || theme.motion === "none" ? "none" : theme.motion;
  const reduce = motion === "none";
  const calm = motion !== "full";
  const cardRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const { box, scrolling } = useLiveBox(view);
  const { where, highlight } = view;
  // Once per step and per kind of place: the light draws, and the card appears where it belongs
  // (it never travels across the screen between steps). Afterwards both follow the target in place.
  const drawKey = `${view.key}:${where?.kind ?? "finding"}`;

  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const update = () => setHeight(node.offsetHeight);
    update();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    observer?.observe(node);
    return () => observer?.disconnect();
  }, [drawKey]);

  // Scrolled away, the card docks toward the target and the light runs to the screen edge it is past.
  const offscreen = where?.kind === "offscreen" ? where : null;
  const aim: Box | null = box ? (offscreen ? edgeBeacon(viewport, box, offscreen.direction, offscreen.band) : inflate(box, RING)) : null;
  // Room for the light to travel; with no light, the card sits close like a tooltip.
  const gap = theme.light ? (theme.guide ? 56 : 40) : 14;
  const placement = placeStep(viewport, offscreen ? box : aim, height, {
    insets: theme.inset,
    maxWidth: theme.maxCardWidth,
    gap,
  });

  const ready = height > 0 && where !== null;
  const drawLight = theme.light && ready && aim !== null && !overlaps(placement, height, aim);
  const route = useMemo(
    () => (drawLight && aim ? path(placement.guide, aim, { gap: theme.guide ? SOCKET / 2 + 2 : 4, leave: OUT_OF[placement.edge] }) : null),
    [drawLight, aim?.x, aim?.y, aim?.width, aim?.height, path, placement.guide.x, placement.guide.y, placement.edge, theme.guide],
  );
  const spotlight = !offscreen && highlight && box && theme.backdrop > 0 && where?.kind !== "notFound";

  return (
    <div className="hb-layer" style={{ zIndex: theme.zIndex, ...themeVars(theme) }}>
      {spotlight && ready ? <Backdrop box={box} radius={highlight.radius} opacity={theme.backdrop} viewport={viewport} /> : null}
      {ready && box && !offscreen ? (
        <Highlight key={`h-${drawKey}`} box={box} radius={highlight?.radius ?? 8} reduce={reduce} calm={calm} />
      ) : null}
      {route ? <Light key={`l-${drawKey}`} route={route} theme={theme} reduce={reduce} calm={calm} /> : null}
      {offscreen && aim && ready ? <Beacon key={`b-${drawKey}`} at={aim} direction={offscreen.direction} /> : null}
      <Card
        key={`c-${drawKey}`}
        cardRef={cardRef}
        view={view}
        theme={theme}
        placement={placement}
        visible={ready}
        glide={!scrolling && !calm}
        motion={motion}
        aimAt={aim}
      />
    </div>
  );
}

/** The card covers its own target (a target as big as the screen): a highlight alone says more than a line. */
function overlaps(placement: StepPlacement, height: number, box: Box): boolean {
  const g = placement.guide;
  return g.x > box.x && g.x < box.x + box.width && g.y > box.y && g.y < box.y + box.height && height > 0;
}

function Backdrop({
  box,
  radius,
  opacity,
  viewport,
}: {
  box: Box;
  radius: number;
  opacity: number;
  viewport: { width: number; height: number };
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pad = RING;
  return (
    <svg
      width={viewport.width}
      height={viewport.height}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, animation: "hb-in .4s ease-out both" }}
    >
      <defs>
        <mask id={`hb-hole-${id}`}>
          <rect width="100%" height="100%" fill="#fff" />
          <rect x={box.x - pad} y={box.y - pad} width={box.width + pad * 2} height={box.height + pad * 2} rx={radius + pad} fill="#000" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`rgba(6, 4, 20, ${opacity})`} mask={`url(#hb-hole-${id})`} />
    </svg>
  );
}

/** The target's glow: a trace of light around its edge as the line arrives, a ripple, then a slow pulse. */
function Highlight({ box, radius, reduce, calm }: { box: Box; radius: number; reduce: boolean; calm: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pad = RING;
  const frame: CSSProperties = {
    position: "absolute",
    left: box.x - pad,
    top: box.y - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
    borderRadius: radius + pad,
  };
  const at = (ms: number) => (reduce ? undefined : `${ms}ms`);
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          ...frame,
          boxShadow:
            "0 0 0 1px color-mix(in srgb, var(--hb-accent) 50%, transparent), 0 0 calc(16px * var(--hb-glow)) 0 color-mix(in srgb, var(--hb-accent) 30%, transparent)",
          animation: reduce
            ? undefined
            : calm
              ? `hb-in .4s ease-out ${DRAW_MS * 0.6}ms both`
              : `hb-in .5s ease-out ${DRAW_MS * 0.7}ms both, hb-pulse 2.8s ease-in-out ${DRAW_MS + 900}ms infinite`,
        }}
      />
      <svg
        aria-hidden="true"
        width={box.width + pad * 2 + 4}
        height={box.height + pad * 2 + 4}
        style={{ position: "absolute", left: box.x - pad - 2, top: box.y - pad - 2, overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`hb-trace-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--hb-accent)" />
            <stop offset="1" stopColor="var(--hb-accent2)" />
          </linearGradient>
        </defs>
        <rect
          x={2}
          y={2}
          width={box.width + pad * 2}
          height={box.height + pad * 2}
          rx={radius + pad}
          fill="none"
          stroke={`url(#hb-trace-${id})`}
          strokeWidth={2}
          pathLength={1}
          strokeDasharray="1 1"
          style={{
            strokeDashoffset: reduce ? 0 : 1,
            animation: reduce ? undefined : `hb-draw 640ms cubic-bezier(.65,0,.35,1) ${at(DRAW_MS * 0.75)} forwards`,
          }}
        />
      </svg>
      {calm ? null : (
        <div
          aria-hidden="true"
          style={{
            ...frame,
            border: "2px solid var(--hb-accent)",
            boxSizing: "border-box",
            opacity: 0,
            animation: `hb-ripple 900ms cubic-bezier(.2,.8,.2,1) ${DRAW_MS}ms both`,
          }}
        />
      )}
    </>
  );
}

/** The light: the path style's route, any companion strands, and a spark that travels it. */
function Light({ route, theme, reduce, calm }: { route: PathRoute; theme: TourTheme; reduce: boolean; calm: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradient = `hb-light-${id}`;
  const draw = (lag: number, duration = DRAW_MS): CSSProperties =>
    reduce
      ? { strokeDashoffset: 0 }
      : { strokeDashoffset: 1, animation: `hb-draw ${duration - lag}ms cubic-bezier(.65,0,.35,1) ${lag}ms forwards` };
  const common = { fill: "none", strokeLinecap: "round" as const, pathLength: 1, strokeDasharray: "1 1" };
  return (
    <>
      <svg aria-hidden="true" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient
            id={gradient}
            gradientUnits="userSpaceOnUse"
            x1={route.start.x}
            y1={route.start.y}
            x2={route.end.x}
            y2={route.end.y}
          >
            <stop offset="0" stopColor={theme.accent} />
            <stop offset="1" stopColor={theme.accent2} />
          </linearGradient>
        </defs>
        <path
          d={route.d}
          {...common}
          stroke={`url(#${gradient})`}
          strokeWidth={3 + 3 * theme.glow}
          strokeOpacity={0.18 * theme.glow}
          style={draw(0)}
        />
        {route.strands?.map((strand, i) => (
          <path
            key={i}
            d={strand.d}
            {...common}
            stroke={`url(#${gradient})`}
            strokeWidth={i === 0 ? 1.1 : 0.9}
            strokeOpacity={i === 0 ? 0.55 : 0.42}
            style={draw(90 + i * 80)}
          />
        ))}
        <path d={route.d} {...common} stroke={`url(#${gradient})`} strokeWidth={2} style={draw(0)} />
      </svg>
      {reduce ? null : <Spark d={route.d} animation={`hb-travel ${DRAW_MS}ms cubic-bezier(.65,0,.35,1) both`} />}
      {calm ? null : <Spark d={route.d} animation={`hb-travel 1.8s cubic-bezier(.45,0,.25,1) ${DRAW_MS + 1400}ms infinite`} />}
    </>
  );
}

function Spark({ d, animation }: { d: string; animation: string }) {
  return (
    <div
      aria-hidden="true"
      style={
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: 7,
          height: 7,
          borderRadius: 99,
          background: "radial-gradient(circle, #fff 0 32%, var(--hb-accent2) 62%, transparent 74%)",
          boxShadow:
            "0 0 calc(3px + 6px * var(--hb-glow)) calc(1px * var(--hb-glow)) color-mix(in srgb, var(--hb-accent) 55%, transparent)",
          // The element's centre rides the line: path coordinates are the layer's, the anchor is the centre.
          offsetPath: `path("${d}")`,
          offsetAnchor: "50% 50%",
          offsetRotate: "0deg",
          opacity: 0,
          animation,
        } as CSSProperties
      }
    />
  );
}

/** Where a scrolled-away target is: a glow pooled on the screen edge, with a chevron nudging toward it. */
function Beacon({ at, direction }: { at: Box; direction: "up" | "down" }) {
  const up = direction === "up";
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: at.x - 70,
        top: up ? at.y : at.y - 40,
        width: 140,
        height: 42,
        animation: `hb-in .5s ease-out ${DRAW_MS * 0.6}ms both`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: "calc(.25 + .75 * var(--hb-glow))",
          background: `radial-gradient(ellipse 50% 100% at 50% ${up ? "0%" : "100%"}, color-mix(in srgb, var(--hb-accent) 55%, transparent), transparent 70%)`,
        }}
      />
      <div
        style={
          {
            position: "absolute",
            left: 59,
            top: up ? 6 : 14,
            width: 22,
            height: 22,
            borderRadius: 99,
            display: "grid",
            placeItems: "center",
            background: "var(--hb-accent)",
            color: "var(--hb-on-accent)",
            boxShadow: "0 4px 12px -4px rgba(0,0,0,.4)",
            transform: up ? "rotate(180deg)" : undefined,
            ["--hb-nudge" as string]: "3px",
          } as CSSProperties
        }
      >
        <svg width="14" height="14" viewBox="0 0 18 18" style={{ animation: "hb-nudge 1.2s ease-in-out infinite" }}>
          <path d="M4.5 7 9 11.5 13.5 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export type GuideMood = "point" | "wait" | "search" | "done";

export interface GuideOrbProps {
  /** point (default), wait (quicker breath), search (dimmer, ring spinning), done. */
  mood?: GuideMood;
  /** Degrees toward what it is looking at: 0 is right, -90 up. */
  angle?: number;
  size?: number;
  /** Colours, when used outside a tour card. Inside one, the theme's are used. */
  accent?: string;
  accent2?: string;
}

/**
 * The guide: a small living light on the card's edge, facing what the step is about. It breathes
 * while it points, quickens while it waits for you, and searches when the target is not here.
 */
export function GuideOrb({ mood = "point", angle = -90, size = ORB, accent, accent2 }: GuideOrbProps) {
  useStyleSheet();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const colours = {
    ...(accent ? { ["--hb-accent" as string]: accent } : null),
    ...(accent2 ? { ["--hb-accent2" as string]: accent2 } : null),
  } as CSSProperties;
  return (
    <svg className="hb-orb" data-mood={mood} viewBox="-20 -20 40 40" width={size} height={size} aria-hidden="true" style={colours}>
      <defs>
        <radialGradient id={`hb-core-${id}`} cx="0.42" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.35" stopColor="var(--hb-accent2)" />
          <stop offset="1" stopColor="var(--hb-accent)" />
        </radialGradient>
        <radialGradient id={`hb-halo-${id}`}>
          <stop offset="0" stopColor="var(--hb-accent)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--hb-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g style={{ opacity: "calc(.35 + .65 * var(--hb-glow, .6))" }}>
        <circle className="hb-halo" r="19" fill={`url(#hb-halo-${id})`} />
      </g>
      <g className="hb-lean" style={{ transform: `rotate(${angle}deg)` }}>
        <g className="hb-ring">
          <ellipse
            rx={mood === "point" ? 12.5 : 11.5}
            ry={11}
            fill="none"
            stroke="var(--hb-accent)"
            strokeWidth="1.3"
            strokeDasharray="34 5 9 5 12 6"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>
        <circle className="hb-core" cx={mood === "point" ? 1.4 : 0} r="6.4" fill={`url(#hb-core-${id})`} />
      </g>
      <g className="hb-orbit">
        <circle cx="15.5" r="1.5" fill="#fff" />
      </g>
      <g className="hb-orbit2">
        <circle cx="-13" cy="4" r="1.1" fill="var(--hb-accent2)" />
      </g>
    </svg>
  );
}

function Words({ text, from = 0, reduce }: { text: string; from?: number; reduce: boolean }) {
  if (reduce) return <>{text}</>;
  const words = text.split(/(\s+)/);
  let index = 0;
  return (
    <>
      {words.map((word, i) => {
        if (/^\s+$/.test(word)) return word;
        const delay = from + Math.min(index++, 40) * 18;
        return (
          <span key={i} className="hb-word" style={{ animationDelay: `${delay}ms` }}>
            {word}
          </span>
        );
      })}
    </>
  );
}

const Icon = {
  next: (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  done: (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  down: (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3v9.5M4 8.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  there: (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4.5 11.5l7-7M6 4.5h5.5V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

function Card({
  cardRef,
  view,
  theme,
  placement,
  visible,
  glide,
  motion,
  aimAt,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  view: TourStepView;
  theme: TourTheme;
  placement: StepPlacement;
  visible: boolean;
  glide: boolean;
  motion: "full" | "calm" | "none";
  aimAt: Box | null;
}) {
  const words = motion === "full";
  const titleId = useId();
  const { step, labels, where } = view;
  // Glide between places once the card has been placed; never on its first appearance.
  const [placed, setPlaced] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setPlaced(true), 50);
    return () => clearTimeout(timer);
  }, [visible]);
  if (!step) return null;

  const up = where?.kind === "offscreen" && where.direction === "up";
  let primary: { label: string; run(): void; icon: ReactNode } | null = null;
  if (view.primary === "showMe")
    primary = {
      label: labels.showMe,
      run: view.showMe,
      icon: <span style={{ display: "inline-flex", transform: up ? "rotate(180deg)" : undefined }}>{Icon.down}</span>,
    };
  else if (view.primary === "takeMeThere") primary = { label: labels.takeMeThere, run: view.takeMeThere, icon: Icon.there };
  else if (view.primary === "done") primary = { label: labels.done, run: view.next, icon: Icon.done };
  else if (view.primary === "next") primary = { label: labels.next, run: view.next, icon: Icon.next };

  const mood: GuideMood =
    where?.kind === "notFound" || where?.kind === "otherScreen"
      ? "search"
      : view.primary === "wait"
        ? "wait"
        : view.isLast
          ? "done"
          : "point";
  const g = placement.guide;
  const angle = aimAt ? (Math.atan2(aimAt.y + aimAt.height / 2 - g.y, aimAt.x + aimAt.width / 2 - g.x) * 180) / Math.PI : -90;
  const steps = Array.from({ length: view.total }, (_, i) => i);
  const text = step.text;

  return (
    <div
      ref={cardRef}
      className="hb-card"
      role="dialog"
      aria-modal="false"
      aria-labelledby={step.title ? titleId : undefined}
      aria-label={step.title ? undefined : labels.stepOf(view.index + 1, view.total)}
      data-edge={theme.guide ? placement.edge : undefined}
      data-move={placed && glide ? "glide" : undefined}
      data-enter={visible && motion !== "none" ? motion : undefined}
      style={{
        left: placement.left,
        top: placement.top,
        width: placement.width,
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <span className="hb-sr" aria-live="polite">
        {labels.announce(step.title, text, view.index + 1, view.total)}
      </span>
      {theme.guide ? (
        <div className="hb-socket" style={{ left: g.x - placement.left, top: g.y - placement.top }}>
          <GuideOrb mood={mood} angle={angle} />
        </div>
      ) : null}
      <div className="hb-head" aria-hidden="true">
        <div className="hb-progress">
          {steps.map((i) => (
            <span key={i} className="hb-seg" data-now={i === view.index ? "" : undefined} data-done={i < view.index ? "" : undefined} />
          ))}
        </div>
        <span className="hb-count">
          {view.index + 1} / {view.total}
        </span>
      </div>
      <div key={view.key ?? ""} aria-hidden="true">
        {step.title ? (
          <h2 id={titleId} className="hb-title">
            <Words text={step.title} reduce={!words} />
          </h2>
        ) : null}
        <p className="hb-text">
          <Words text={text} from={step.title ? 90 : 0} reduce={!words} />
        </p>
      </div>
      {where?.kind === "notFound" ? (
        <p className="hb-note">
          {Icon.search}
          <span>{labels.notFound}</span>
        </p>
      ) : null}
      <div className="hb-foot">
        <button type="button" className="hb-button hb-skip" onClick={view.skip} aria-keyshortcuts="Escape" title={`${labels.skip} (Esc)`}>
          {labels.skip}
        </button>
        <div className="hb-actions">
          {view.primary === "wait" ? (
            <span className="hb-turn">
              <i />
              {labels.yourTurn}
            </span>
          ) : null}
          {view.isFirst ? null : (
            <button type="button" className="hb-button" onClick={view.back} aria-keyshortcuts="ArrowLeft">
              {labels.back}
            </button>
          )}
          {primary ? (
            <button type="button" className="hb-button hb-primary" onClick={primary.run} aria-keyshortcuts="ArrowRight">
              {primary.label}
              {primary.icon}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
