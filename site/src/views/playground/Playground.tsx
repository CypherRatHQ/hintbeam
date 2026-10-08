"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOUR_PATHS, parseTour, useScreenLink, useTarget, useTour, type TourPathName, type TourProblem, type TourStyle } from "hintbeam";
import { clearEventLog, useEventLog } from "@/src/eventLog";
import { BracesIcon, ChartIcon, GridIcon, PlayIcon, UsersIcon } from "@/src/components/Icons";
import { Code } from "@/src/components/Code";
import { BRANDS, DEFAULT_SETTINGS, LANGUAGES, presetRadius, STYLES, themeCode, themeFor, useSettings, type Language } from "@/src/settings";
import { playgroundTour, targets } from "@/src/tours";

/** The playground frame: the Acme app with its sidebar, the Customise panel and live events. Each Acme page is its own route. */
export function PlaygroundShell({ children }: { children: ReactNode }) {
  return (
    <div className="container pg">
      <div className="pg-head">
        <div>
          <h1>Playground</h1>
          <p>
            Acme is a small dashboard with four pages, a long feed and an export that takes a moment. Shape the tour in the Customise panel,
            play it, then copy the theme into your app.
          </p>
        </div>
        <PlayButton />
      </div>
      <div className="pg-grid">
        <div className="app">
          <Sidebar />
          <div className="app-main">{children}</div>
        </div>
        <div className="pg-side">
          <Lab />
          <Inspector />
        </div>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
}) {
  return (
    <div className="lab-group">
      <span>{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Lab() {
  const ref = useTarget<HTMLDivElement>("controls", { radius: 18 });
  const { settings, update } = useSettings();
  const theme = themeFor(settings);
  const pickStyle = (style: TourStyle) =>
    update({ style, path: null, glow: null, backdrop: null, guide: null, radius: presetRadius(style) });
  return (
    <section ref={ref} className="customise" aria-label="Customise the tour">
      <div className="customise-head">
        <div>
          <h2>Customise</h2>
          <p className="customise-hint">Changes apply to the tour right away.</p>
        </div>
        <button type="button" className="link-button" onClick={() => update(DEFAULT_SETTINGS)}>
          Reset
        </button>
      </div>

      <div className="field">
        <span className="field-label">Style</span>
        <div className="style-grid" role="radiogroup" aria-label="Style">
          {(Object.keys(STYLES) as TourStyle[]).map((style) => (
            <button
              key={style}
              type="button"
              role="radio"
              aria-checked={settings.style === style}
              className="style-option"
              onClick={() => pickStyle(style)}
            >
              <strong>{STYLES[style].name}</strong>
              <span>{STYLES[style].blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Brand colour</span>
        <div className="swatches">
          {BRANDS.map((b) => (
            <button
              key={b.value}
              type="button"
              className="swatch"
              style={{ background: b.value }}
              aria-label={b.name}
              aria-pressed={settings.brand.toLowerCase() === b.value.toLowerCase()}
              onClick={() => update({ brand: b.value })}
            />
          ))}
          <label className="swatch swatch-custom" title="Any colour">
            <input
              type="color"
              value={settings.brand}
              onChange={(e) => update({ brand: e.target.value })}
              aria-label="Custom brand colour"
            />
          </label>
        </div>
      </div>

      <div className="field-row">
        <Segmented
          label="Card colour"
          value={settings.mode}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          onChange={(mode) => update({ mode })}
        />
        <Segmented
          label="Guide orb"
          value={theme.guide ? "on" : "off"}
          options={[
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
          onChange={(v) => update({ guide: v === "on" })}
        />
      </div>

      <div className="field">
        <span className="field-label">Line style</span>
        <div className="chips">
          {(Object.keys(TOUR_PATHS) as TourPathName[]).map((p) => (
            <button
              key={p}
              type="button"
              className="chip"
              aria-pressed={theme.light && theme.path === p}
              onClick={() => update({ path: p })}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <Slider label="Glow" value={theme.glow} min={0} max={1} step={0.05} onChange={(glow) => update({ glow })} />
      <Slider label="Dim the page" value={theme.backdrop} min={0} max={0.7} step={0.05} onChange={(backdrop) => update({ backdrop })} />
      <Slider label="Corners" value={settings.radius} min={0} max={24} step={1} unit="px" onChange={(radius) => update({ radius })} />

      <div className="field-row">
        <label className="field">
          <span className="field-label">Language</span>
          <select className="select" value={settings.language} onChange={(e) => update({ language: e.target.value as Language })}>
            {(Object.keys(LANGUAGES) as Language[]).map((l) => (
              <option key={l} value={l}>
                {LANGUAGES[l].name}
              </option>
            ))}
          </select>
        </label>
        <Segmented
          label="Step card"
          value={settings.customCard ? "custom" : "built-in"}
          options={[
            { value: "built-in", label: "Built-in" },
            { value: "custom", label: "Custom" },
          ]}
          onChange={(v) => update({ customCard: v === "custom" })}
        />
      </div>

      <div className="field">
        <span className="field-label">Your theme, as code</span>
        <Code code={themeCode(settings)} language="tsx" title="theme.ts" />
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange(value: number): void;
}) {
  return (
    <label className="field slider">
      <span className="field-label">
        {label}
        <output>
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {unit}
        </output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function PlayButton() {
  const tour = useTour();
  return (
    <div className="lab-play">
      {tour.isActive ? (
        <span className="lab-status">
          Step {tour.index + 1} of {tour.total}
        </span>
      ) : null}
      <button type="button" className="btn btn-primary btn-lg" onClick={() => void tour.start(playgroundTour)}>
        <PlayIcon />
        Play the tour
      </button>
    </div>
  );
}

function Inspector() {
  const entries = useEventLog();
  return (
    <aside className="inspector" aria-label="Live tour events">
      <div className="inspector-head">
        <span className="live-dot" />
        Live events
        {entries.length ? (
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={clearEventLog}>
            Clear
          </button>
        ) : (
          <small>live</small>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="log-empty">
          Play a tour. Each start, step, skip and finish shows up here — the same events your analytics would receive.
        </p>
      ) : (
        <ol className="log">
          {entries.map((e) => (
            <li key={e.id}>
              <span className={`type ${e.type}`}>{e.type}</span>
              <span className="what">{e.text}</span>
              <time>{e.at}</time>
            </li>
          ))}
        </ol>
      )}
      <div className="inspector-foot">
        Sent by a small plugin using <code>onEvent</code>. <Link href="/docs/plugins">How plugins work</Link>
      </div>
    </aside>
  );
}

function SideLink({ to, screen, icon, children }: { to: string; screen: string; icon: ReactNode; children: string }) {
  const ref = useScreenLink<HTMLAnchorElement>(screen, { radius: 8 });
  const active = usePathname() === to;
  return (
    <Link ref={ref} href={to} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
      {icon}
      {children}
    </Link>
  );
}

function Sidebar() {
  return (
    <nav className="app-side" aria-label="Acme">
      <div className="app-brand">
        <b />
        Acme Analytics
      </div>
      <SideLink to="/playground" screen="/playground" icon={<GridIcon />}>
        Dashboard
      </SideLink>
      <SideLink to="/playground/reports" screen="/playground/reports" icon={<ChartIcon />}>
        Reports
      </SideLink>
      <SideLink to="/playground/team" screen="/playground/team" icon={<UsersIcon />}>
        Team
      </SideLink>
      <SideLink to="/playground/json" screen="/playground/json" icon={<BracesIcon />}>
        Tour as JSON
      </SideLink>
    </nav>
  );
}

const PEOPLE = [
  { name: "Priya", color: "#9D86FF" },
  { name: "Marco", color: "#4CD6FF" },
  { name: "Lena", color: "#FF8FA3" },
  { name: "Sam", color: "#45D483" },
  { name: "Aiko", color: "#FFB86B" },
  { name: "Tomás", color: "#7FDBFF" },
];
const ACTIONS = ["exported a report", "invited a teammate", "updated a dashboard", "shared a chart", "added a data source"];
const ACTIVITY = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  who: PEOPLE[i % PEOPLE.length]!,
  what: ACTIONS[i % ACTIONS.length]!,
  when: i < 1 ? "just now" : i < 23 ? `${i}h ago` : "3 weeks ago",
}));

export function Dashboard() {
  const revenue = useTarget<HTMLDivElement>("revenue", { radius: 14 });
  const exportButton = useTarget<HTMLButtonElement>("exportButton", { radius: 10 });
  const oldest = useTarget<HTMLLIElement>("oldestActivity", { radius: 8 });
  const { emit } = useTour();
  const [exporting, setExporting] = useState<"idle" | "busy" | "done">("idle");

  const exportReport = () => {
    setExporting("busy");
    setTimeout(() => {
      setExporting("done");
      emit("report.exported");
    }, 900);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p>Last 30 days</p>
        </div>
        <button ref={exportButton} type="button" className="btn btn-sm" onClick={exportReport} disabled={exporting === "busy"}>
          {exporting === "busy" ? "Exporting…" : exporting === "done" ? "Exported ✓" : "Export report"}
        </button>
      </div>
      <div className="kpis">
        <div ref={revenue} className="kpi">
          <span>Revenue</span>
          <strong>$48,210</strong>
          <em className="up">+12.4%</em>
        </div>
        <div className="kpi">
          <span>Active users</span>
          <strong>3,904</strong>
          <em className="up">+5.1%</em>
        </div>
        <div className="kpi">
          <span>Churn</span>
          <strong>1.8%</strong>
          <em className="down">−0.3%</em>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          Activity{" "}
          <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
            {ACTIVITY.length} events
          </span>
        </div>
        <ul className="activity">
          {ACTIVITY.map((a, i) => (
            <li key={a.id} ref={i === ACTIVITY.length - 1 ? oldest : undefined}>
              <span className="avatar" style={{ background: a.who.color }}>
                {a.who.name[0]}
              </span>
              <span>
                <b>{a.who.name}</b> {a.what}
              </span>
              <time>{a.when}</time>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function Reports() {
  const chart = useTarget<HTMLDivElement>("chart", { radius: 14 });
  const bars = [32, 45, 38, 60, 52, 71, 66, 80, 74, 92];
  return (
    <>
      <div className="page-head">
        <div>
          <h2>Reports</h2>
          <p>Growth, week by week</p>
        </div>
      </div>
      <div ref={chart} className="chart-card">
        <h3>Weekly sign-ups</h3>
        <p>+38% over ten weeks</p>
        <svg viewBox="0 0 400 220" preserveAspectRatio="none" role="img" aria-label="Sign-ups rising over ten weeks">
          <defs>
            <linearGradient id="bar-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9D86FF" />
              <stop offset="1" stopColor="#9D86FF" stopOpacity=".15" />
            </linearGradient>
          </defs>
          {[55, 110, 165].map((y) => (
            <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="rgba(255,255,255,.06)" />
          ))}
          {bars.map((b, i) => (
            <rect key={i} x={8 + i * 39.5} y={220 - b * 2.2} width="26" height={b * 2.2} rx="6" fill="url(#bar-g)" />
          ))}
        </svg>
      </div>
    </>
  );
}

export function Team() {
  const invite = useTarget<HTMLButtonElement>("invite", { radius: 10 });
  const { emit } = useTour();
  const [invited, setInvited] = useState(0);
  const members = [
    { name: "Priya Shah", email: "priya@acme.app", role: "Owner", color: "#9D86FF" },
    { name: "Marco Rossi", email: "marco@acme.app", role: "Admin", color: "#4CD6FF" },
    { name: "Lena Vogel", email: "lena@acme.app", role: "Analyst", color: "#FF8FA3" },
  ];
  return (
    <>
      <div className="page-head">
        <div>
          <h2>Team</h2>
          <p>{members.length + invited} people</p>
        </div>
        <button
          ref={invite}
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setInvited((n) => n + 1);
            emit("teammate.invited");
          }}
        >
          Invite teammate
        </button>
      </div>
      <div className="panel" style={{ marginTop: 0 }}>
        <ul className="members">
          {members.map((m) => (
            <li key={m.email}>
              <span className="avatar" style={{ background: m.color, width: 32, height: 32 }}>
                {m.name[0]}
              </span>
              <span>
                {m.name}
                <small>{m.email}</small>
              </span>
              <span className="role">{m.role}</span>
            </li>
          ))}
          {Array.from({ length: invited }, (_, i) => (
            <li key={`new-${i}`} className="pending">
              <span className="avatar" style={{ background: "var(--surface-3)", width: 32, height: 32 }}>
                ?
              </span>
              <span>
                New teammate
                <small>Invitation sent</small>
              </span>
              <span className="role">Pending</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const STARTER = JSON.stringify(
  {
    id: "my-tour",
    steps: [
      { target: "revenue", title: "Revenue", text: "This tour was written as JSON and checked before playing." },
      { target: "chart", text: "It crosses pages like any other tour." },
      { target: "invite", text: "Try misspelling a target to see the validator.", advanceOn: "tap" },
    ],
  },
  null,
  2,
);

export function JsonTour() {
  const editor = useTarget<HTMLTextAreaElement>("jsonEditor", { radius: 14 });
  const [text, setText] = useState(STARTER);
  const { start } = useTour();
  const result = useMemo(() => {
    try {
      return parseTour(JSON.parse(text), targets);
    } catch (error) {
      return { ok: false as const, problems: [{ path: "", message: `Not valid JSON: ${(error as Error).message}` }] as TourProblem[] };
    }
  }, [text]);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => setBlocked(false), [text]);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Tour as JSON</h2>
          <p>Validated against this site's targets as you type</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!result.ok}
          onClick={() => result.ok && void start(result.tour).then((r) => setBlocked(r === "blocked"))}
        >
          <PlayIcon />
          Play this tour
        </button>
      </div>
      <div className="json-grid">
        <textarea ref={editor} value={text} spellCheck={false} onChange={(e) => setText(e.target.value)} aria-label="Tour JSON" />
        <div>
          <div className={`validation ${result.ok ? "ok" : "bad"}`} role="status">
            {result.ok ? (
              <>✓ Valid tour · {result.tour.steps.length} steps</>
            ) : (
              <ul>
                {result.problems.map((p, i) => (
                  <li key={i}>
                    <code>{p.path || "tour"}</code> {p.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {blocked ? <p className="muted">A plugin blocked this tour.</p> : null}
          <div className="targets-list">
            {targets.names.map((name) => (
              <div key={name}>
                <code>{name}</code>
                <span>{targets.about(name)}</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
            The same check runs on a server or in CI with <code>hintbeam/core</code>.
          </p>
        </div>
      </div>
    </>
  );
}
