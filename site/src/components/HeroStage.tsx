"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { TOUR_PATHS, GuideOrb, type GuideMood, type TourPathName, type TourTheme } from "hintbeam";
// The hero draws its own scene with the same engine a renderer would use.
import { edgeBeacon, inflate, placeStep, type Box } from "hintbeam/core";
import { themeFor, useSettings } from "../settings";

/**
 * The hero's living demo: a small app in a fixed 1000×588 canvas, scaled to fit, where the real
 * placement, path styles and guide from hintbeam walk through the four places a target can be.
 * Decorative: the real tour is one click away.
 */

const OUT_OF = { top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } } as const;

type Target = "revenue" | "feed" | "reports" | "exportButton";

/** The demo app in two shapes: a desktop dashboard, and the same app on a phone (cards dock, as they do on phones). */
const LAYOUTS = {
  desktop: {
    width: 1000,
    height: 588,
    options: { insets: { top: 16, bottom: 16, horizontal: 16 }, maxWidth: 320, gap: 56 },
    band: undefined as { top: number; bottom: number } | undefined,
    boxes: {
      revenue: { x: 228, y: 78, width: 238, height: 92 },
      exportButton: { x: 866, y: 24, width: 106, height: 34 },
      reports: { x: 14, y: 98, width: 172, height: 34 },
      // Far down the page, out of the canvas.
      feed: { x: 228, y: 760, width: 744, height: 60 },
    } satisfies Record<Target, Box>,
  },
  phone: {
    width: 360,
    height: 680,
    options: { insets: { top: 64, bottom: 72, horizontal: 12 }, maxWidth: 336, gap: 56, dock: true },
    band: { top: 56, bottom: 624 },
    boxes: {
      revenue: { x: 16, y: 72, width: 328, height: 96 },
      exportButton: { x: 270, y: 13, width: 74, height: 30 },
      reports: { x: 102, y: 632, width: 66, height: 40 },
      feed: { x: 16, y: 900, width: 328, height: 56 },
    } satisfies Record<Target, Box>,
  },
};

type Scene = {
  label: string;
  target: Target;
  radius: number;
  kind: "visible" | "offscreen" | "otherScreen";
  title: string;
  text: string;
  primary: string | null;
  mood: GuideMood;
};

const SCENES: Scene[] = [
  {
    label: "Here",
    target: "revenue",
    radius: 12,
    kind: "visible",
    title: "Revenue, at a glance",
    text: "In view: the light leaves the guide and lands on the real element.",
    primary: "Next",
    mood: "point",
  },
  {
    label: "Scrolled away",
    target: "feed",
    radius: 12,
    kind: "offscreen",
    title: "Further down",
    text: "Out of view: the light runs to the edge it is past. Show me brings it in.",
    primary: "Show me",
    mood: "point",
  },
  {
    label: "Another page",
    target: "reports",
    radius: 8,
    kind: "otherScreen",
    title: "It lives in Reports",
    text: "On another page: the link lights up, and the tour follows you there.",
    primary: "Take me there",
    mood: "search",
  },
  {
    label: "Your turn",
    target: "exportButton",
    radius: 8,
    kind: "visible",
    title: "Export it yourself",
    text: "Steps can wait for a real tap or an app event. Nothing is blocked.",
    primary: null,
    mood: "wait",
  },
];

const varsOf = (theme: TourTheme): CSSProperties => ({
  ["--hb-accent" as string]: theme.accent,
  ["--hb-accent2" as string]: theme.accent2,
  ["--hb-on-accent" as string]: theme.onAccent,
  ["--hb-card" as string]: theme.card,
  ["--hb-border" as string]: theme.border,
  ["--hb-text" as string]: theme.text,
  ["--hb-muted" as string]: theme.mutedText,
  ["--hb-radius" as string]: `${theme.radius}px`,
  ["--hb-font" as string]: "inherit",
  ["--hb-glow" as string]: String(theme.glow),
});

export function HeroStage() {
  const { settings } = useSettings();
  const theme = themeFor(settings);
  const pathName: TourPathName = theme.path && theme.path in TOUR_PATHS ? (theme.path as TourPathName) : "wave";
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [shape, setShape] = useState<keyof typeof LAYOUTS>("desktop");
  const layout = LAYOUTS[shape];
  const W = layout.width;
  const H = layout.height;
  const VIEW = { width: W, height: H };
  const [height, setHeight] = useState(150);
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);

  useLayoutEffect(() => {
    const outer = wrap.current;
    if (!outer) return;
    const update = () => {
      const next = outer.clientWidth < 600 ? "phone" : "desktop";
      setShape(next);
      if (frame.current) setScale(frame.current.clientWidth / LAYOUTS[next].width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    if (frame.current) observer.observe(frame.current);
    return () => observer.disconnect();
  }, [shape]);

  useLayoutEffect(() => {
    if (card.current) setHeight(card.current.offsetHeight);
  }, [index, shape]);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % SCENES.length);
    }, 4600);
    return () => clearInterval(timer);
  }, [auto]);

  const scene = SCENES[index]!;
  const box = layout.boxes[scene.target];
  const offscreen = scene.kind === "offscreen";
  const aim = offscreen ? edgeBeacon(VIEW, box, "down", layout.band) : inflate(box, 6);
  const placement = placeStep(VIEW, box, height, layout.options);
  const route = TOUR_PATHS[pathName](placement.guide, aim, { gap: theme.guide ? 23 : 4, leave: OUT_OF[placement.edge] });
  const g = placement.guide;
  const angle = (Math.atan2(aim.y + aim.height / 2 - g.y, aim.x + aim.width / 2 - g.x) * 180) / Math.PI;
  const pad = 6;
  const ring = { left: box.x - pad, top: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 };
  const words = (text: string, from = 0) =>
    text.split(" ").map((word, i) => (
      <span key={i} className="hb-word" style={{ animationDelay: `${from + i * 22}ms` }}>
        {word}{" "}
      </span>
    ));

  return (
    <div className="stage-wrap" ref={wrap}>
      <div className={shape === "phone" ? "window phone" : "window"}>
        {shape === "desktop" ? (
          <div className="window-bar">
            <i />
            <i />
            <i />
            <span className="url">acme.app/dashboard</span>
          </div>
        ) : null}
        <div className="stage" ref={frame} aria-hidden="true" style={{ aspectRatio: `${W} / ${H}` }}>
          <div className="stage-canvas" style={{ width: W, height: H, transform: `scale(${scale})`, ...varsOf(theme) }}>
            {shape === "phone" ? (
              <PhoneMock highlightReports={scene.kind === "otherScreen"} />
            ) : (
              <MockApp highlightReports={scene.kind === "otherScreen"} />
            )}

            {/* Spotlight */}
            {!offscreen && theme.backdrop > 0 ? (
              <svg
                key={`dim-${index}`}
                width={W}
                height={H}
                style={{ position: "absolute", inset: 0, animation: "hb-in .5s ease-out both" }}
              >
                <defs>
                  <mask id="stage-hole">
                    <rect width={W} height={H} fill="#fff" />
                    <rect x={ring.left} y={ring.top} width={ring.width} height={ring.height} rx={scene.radius + pad} fill="#000" />
                  </mask>
                </defs>
                <rect width={W} height={H} fill={`rgba(6,4,20,${Math.min(0.6, theme.backdrop + 0.1)})`} mask="url(#stage-hole)" />
              </svg>
            ) : null}

            {/* Light */}
            {theme.light ? (
              <svg key={`light-${index}-${pathName}`} width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                <defs>
                  <linearGradient
                    id="stage-light"
                    gradientUnits="userSpaceOnUse"
                    x1={route.start.x}
                    y1={route.start.y}
                    x2={route.end.x}
                    y2={route.end.y}
                  >
                    <stop offset="0" stopColor="var(--hb-accent)" />
                    <stop offset="1" stopColor="var(--hb-accent2)" />
                  </linearGradient>
                </defs>
                <path
                  d={route.d}
                  pathLength={1}
                  className="stage-draw"
                  stroke="url(#stage-light)"
                  strokeWidth={3 + 3 * theme.glow}
                  strokeOpacity={0.18 * theme.glow}
                />
                {route.strands?.map((s, i) => (
                  <path
                    key={i}
                    d={s.d}
                    pathLength={1}
                    className="stage-draw"
                    stroke="url(#stage-light)"
                    strokeWidth={1}
                    strokeOpacity={0.5}
                    style={{ animationDelay: `${300 + i * 80}ms` }}
                  />
                ))}
                <path d={route.d} pathLength={1} className="stage-draw" stroke="url(#stage-light)" strokeWidth={2} />
              </svg>
            ) : null}
            {theme.light ? (
              <div
                key={`spark-${index}-${pathName}`}
                className={`stage-spark${theme.motion === "full" ? "" : " once"}`}
                style={{ offsetPath: `path("${route.d}")` } as CSSProperties}
              />
            ) : null}

            {/* Target */}
            {offscreen ? (
              <div key={`beacon-${index}`} className="stage-beacon" style={{ left: aim.x - 80, top: (layout.band?.bottom ?? H) - 48 }}>
                <span className="stage-chevron">
                  <svg width="14" height="14" viewBox="0 0 18 18">
                    <path
                      d="M4.5 7 9 11.5 13.5 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            ) : (
              <>
                <div key={`glow-${index}`} className="stage-glow" style={{ ...ring, borderRadius: scene.radius + pad }} />
                {theme.motion === "full" ? (
                  <div key={`ripple-${index}`} className="stage-ripple" style={{ ...ring, borderRadius: scene.radius + pad }} />
                ) : null}
              </>
            )}

            {/* The card: the library's own styles */}
            <div
              ref={card}
              className="hb-card stage-card"
              data-edge={theme.guide ? placement.edge : undefined}
              style={{ left: placement.left, top: placement.top, width: placement.width }}
            >
              {theme.guide ? (
                <div className="hb-socket" style={{ left: g.x - placement.left, top: g.y - placement.top }}>
                  <GuideOrb mood={scene.mood} angle={angle} />
                </div>
              ) : null}
              <div className="hb-head">
                <div className="hb-progress">
                  {SCENES.map((_, i) => (
                    <span key={i} className="hb-seg" data-now={i === index ? "" : undefined} data-done={i < index ? "" : undefined} />
                  ))}
                </div>
                <span className="hb-count">
                  {index + 1} / {SCENES.length}
                </span>
              </div>
              <div key={`words-${index}`}>
                <h2 className="hb-title">{words(scene.title)}</h2>
                <p className="hb-text">{words(scene.text, 90)}</p>
              </div>
              <div className="hb-foot">
                <span className="hb-button hb-skip">Skip</span>
                <div className="hb-actions">
                  {scene.primary ? (
                    <span className="hb-button hb-primary">{scene.primary}</span>
                  ) : (
                    <span className="hb-turn">
                      <i />
                      Your turn
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="stage-controls" role="group" aria-label="Demo scenes">
        {SCENES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            className="chip"
            aria-pressed={i === index}
            onClick={() => {
              setAuto(false);
              setIndex(i);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MockApp({ highlightReports }: { highlightReports: boolean }) {
  const links = ["Dashboard", "Reports", "Team", "Settings"];
  const bars = [38, 52, 44, 66, 58, 80, 72, 90, 84, 104, 96, 118];
  return (
    <div className="mock">
      <div className="mock-side">
        <div className="mock-logo">
          <b />
          Acme
        </div>
        {links.map((l, i) => (
          <div key={l} className={`mock-link${i === 0 ? " on" : ""}`} style={highlightReports && i === 1 ? { color: "#fff" } : undefined}>
            <i />
            {l}
          </div>
        ))}
      </div>
      <div className="mock-main">
        <div className="mock-head">
          <h4>Dashboard</h4>
          <span className="mock-btn" style={{ width: 106, justifyContent: "center" }}>
            Export
          </span>
        </div>
        <div className="mock-kpis">
          {[
            ["Revenue", "$48,210", "+12.4%"],
            ["Active users", "3,904", "+5.1%"],
            ["Conversion", "4.8%", "+0.6%"],
          ].map(([a, b, c]) => (
            <div key={a} className="mock-kpi">
              <span>{a}</span>
              <strong>{b}</strong>
              <em>{c}</em>
            </div>
          ))}
        </div>
        <div className="mock-chart">
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Weekly sign-ups</span>
          <svg viewBox="0 0 700 140" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mock-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#9D86FF" stopOpacity=".9" />
                <stop offset="1" stopColor="#9D86FF" stopOpacity=".15" />
              </linearGradient>
            </defs>
            {bars.map((b, i) => (
              <rect key={i} x={8 + i * 58} y={140 - b} width={38} height={b} rx={6} fill="url(#mock-bar)" />
            ))}
          </svg>
        </div>
        <div className="mock-row">
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}

function PhoneMock({ highlightReports }: { highlightReports: boolean }) {
  const bars = [30, 44, 38, 56, 50, 70, 64, 82];
  const tabs = ["Home", "Reports", "Team", "More"];
  return (
    <div className="pmock">
      <div className="pmock-head">
        <strong>Dashboard</strong>
        <span className="mock-btn">Export</span>
      </div>
      <div className="pmock-body">
        {[
          ["Revenue", "$48,210", "+12.4%"],
          ["Active users", "3,904", "+5.1%"],
        ].map(([a, b, c]) => (
          <div key={a} className="mock-kpi pmock-kpi">
            <span>{a}</span>
            <strong>{b}</strong>
            <em>{c}</em>
          </div>
        ))}
        <div className="mock-chart pmock-chart">
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Weekly sign-ups</span>
          <svg viewBox="0 0 300 120" preserveAspectRatio="none">
            {bars.map((b, i) => (
              <rect key={i} x={6 + i * 37} y={120 - b} width={24} height={b} rx={5} fill="#9D86FF" opacity={0.25 + i * 0.08} />
            ))}
          </svg>
        </div>
        <div className="pmock-row" />
        <div className="pmock-row" />
      </div>
      <div className="pmock-tabs">
        {tabs.map((t, i) => (
          <span key={t} className={i === 0 ? "on" : undefined} style={highlightReports && i === 1 ? { color: "#fff" } : undefined}>
            <i />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
