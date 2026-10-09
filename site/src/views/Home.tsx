"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { TOUR_PATHS, useTarget, useTour, type TourPathName, type TourStyle } from "hintbeam";
import { Code, CodeTabs } from "@/src/components/Code";
import { HeroStage } from "@/src/components/HeroStage";
import { ArrowRight, CheckIcon, CopyIcon, PlayIcon } from "@/src/components/Icons";
import { BRANDS, presetRadius, STYLES, themeFor, useSettings } from "@/src/settings";
import { siteTour } from "@/src/tours";
import { BASE_PATH } from "@/lib/site";
import pkg from "hintbeam/package.json";

const DESCRIBE = `
import { defineTargets, defineTour } from "hintbeam";

export const targets = defineTargets({
  search:  { screen: "/food",     about: "The food search box" },
  logMeal: { screen: "/food",     about: "The log button" },
  weight:  { screen: "/progress", about: "This week's chart" },
});

export const firstMeal = defineTour(targets, {
  id: "first-meal",
  steps: [
    { target: "search",  title: "Find anything", text: "Search what you ate." },
    { target: "logMeal", text: "Log it with one tap.", advanceOn: "tap" },
    { target: "weight",  text: "Your progress lives here." },
  ],
});`;

const TAG = `
import { useTarget, useTour } from "hintbeam";

function FoodPage() {
  const search = useTarget("search"); // a ref — nothing is wrapped
  return <input ref={search} placeholder="Search" />;
}

function HelpButton() {
  const { start } = useTour();
  return <button onClick={() => start(firstMeal)}>Show me around</button>;
}`;

const NEXT = `
// app/tours.tsx
"use client";
import { TourProvider, createTourTheme } from "hintbeam";
import { useNextRouter } from "hintbeam/next";
import { targets } from "./tour-data";

const theme = createTourTheme({ brand: "#6D4AFF", style: "balanced" });

export function Tours({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider targets={targets} router={useNextRouter()} theme={theme}>
      {children}
    </TourProvider>
  );
}`;

const VITE = `
import { TourProvider } from "hintbeam";
import { useReactRouter } from "hintbeam/react-router";

// inside <BrowserRouter>
export function Root() {
  return (
    <TourProvider targets={targets} router={useReactRouter()}>
      <App />
    </TourProvider>
  );
}`;

const EXPO = `
// app/_layout.tsx
import { Stack } from "expo-router";
import { TourProvider } from "hintbeam";
import { useExpoRouter } from "hintbeam/expo-router";

export default function Layout() {
  return (
    <TourProvider targets={targets} router={useExpoRouter()}>
      <Stack />
    </TourProvider>
  );
}`;

const INSTALL = [
  { label: "npm", code: "npm install hintbeam\n\n# That's all. No CSS to import, no config file.", language: "bash" },
  { label: "pnpm", code: "pnpm add hintbeam\n\n# That's all. No CSS to import, no config file.", language: "bash" },
  { label: "yarn", code: "yarn add hintbeam\n\n# That's all. No CSS to import, no config file.", language: "bash" },
  {
    label: "Expo",
    code: "npx expo install hintbeam react-native-svg\n\n# react-native-svg draws the light. Nothing else to set up.",
    language: "bash",
  },
];

const HOW = [
  {
    title: "Install",
    text: "One package for web and React Native. Expo apps also need react-native-svg.",
    tabs: INSTALL,
  },
  {
    title: "Write a tour",
    text: "List the things a tour can point at, then write the steps. Tours are plain data, checked as you type.",
    tabs: [{ label: "tours.ts", code: DESCRIBE, language: "ts" }],
  },
  {
    title: "Add the provider",
    text: "Wrap your app once and pass your router, so tours can follow people between pages.",
    tabs: [
      { label: "Next.js", code: NEXT },
      { label: "Vite + React Router", code: VITE },
      { label: "Expo", code: EXPO },
    ],
  },
  {
    title: "Mark elements and start",
    text: "Add a ref to what you already render — no wrappers. Start the tour from a button, or on first visit.",
    tabs: [{ label: "FoodPage.tsx", code: TAG }],
  },
];

export function Home({ agentPrompt }: { agentPrompt: string }) {
  const start = useTarget<HTMLButtonElement>("heroStart", { radius: 12 });
  const tour = useTour();

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-copy">
            <Link href="/docs/changelog" className="announce">
              <span className="tag">v{pkg.version}</span>
              <span>
                What's new<span className="long">: styles, brand colours and the three-strand light</span>
              </span>
              →
            </Link>
            <h1>
              Product tours that
              <br />
              <DrawnWords>find their own way.</DrawnWords>
            </h1>
            <p className="lead">
              Show people around your app with tours that keep working when things scroll, move, or live on another page. Open source, for
              React, Next.js and React Native.
            </p>
            <div className="hero-actions">
              <button ref={start} type="button" className="btn btn-primary btn-lg" onClick={() => void tour.start(siteTour)}>
                <PlayIcon />
                {tour.canResume(siteTour) ? "Resume the tour" : "Take the 30-second tour"}
              </button>
              <InstallCommand />
            </div>
            <div className="facts">
              <span>
                <b>MIT</b> licensed
              </span>
              <span>
                <b>0</b> runtime dependencies
              </span>
              <span>
                <b>100+</b> tests
              </span>
              <span>
                React <b>≥ 18</b> · React Native <b>≥ 0.73</b>
              </span>
            </div>
          </div>
          <HeroStage />
        </div>
      </section>

      <section className="works-with">
        <div className="container">
          <p>Works with</p>
          <div className="logos">
            {["React", "Next.js", "Vite", "React Router", "Remix", "Expo", "React Native", "React Navigation"].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <Different />
      <Places />
      <Features />
      <How agentPrompt={agentPrompt} />
      <Questions />
      <OpenCore />

      <div className="container">
        <section className="cta">
          <h2>See it on a real app.</h2>
          <p>A four-page dashboard with a long feed and a tour editor. Pick a style and your brand colour, then copy the theme.</p>
          <div className="hero-actions">
            <Link href="/playground" className="btn btn-primary btn-lg">
              Open the playground
              <ArrowRight />
            </Link>
            <Link href="/docs/getting-started" className="btn btn-lg">
              Read the guide
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function InstallCommand() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="install"
      aria-label="Copy the install command"
      onClick={() => {
        void navigator.clipboard?.writeText("npm i hintbeam").then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
    >
      <span>
        <span className="prompt">$</span> npm i hintbeam
      </span>
      <span className="copy">{copied ? <CheckIcon /> : <CopyIcon />}</span>
    </button>
  );
}

/** The headline's underline: three strands of light that leave apart and meet at the full stop. */
const UNDERLINE = {
  main: "M 3 16 C 120 24, 262 6, 397 10",
  strands: ["M 6 8 C 124 18, 268 2, 397 10", "M 2 24 C 114 30, 254 14, 397 10"],
};

function DrawnWords({ children }: { children: string }) {
  return (
    <span className="drawn">
      {children}
      <svg viewBox="0 0 400 32" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="drawn-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9D86FF" />
            <stop offset="1" stopColor="#4CD6FF" />
          </linearGradient>
        </defs>
        {UNDERLINE.strands.map((d) => (
          <path key={d} d={d} pathLength={1} stroke="url(#drawn-g)" strokeWidth={1} strokeOpacity={0.45} />
        ))}
        <path d={UNDERLINE.main} pathLength={1} stroke="url(#drawn-g)" strokeWidth={2.4} />
      </svg>
    </span>
  );
}

/* ——— The four places ——— */

function PlaceArt({ kind }: { kind: "visible" | "offscreen" | "otherScreen" | "notFound" }) {
  const light = (d: string) => (
    <>
      <path d={d} fill="none" stroke="url(#place-g)" strokeWidth="6" strokeOpacity=".15" strokeLinecap="round" />
      <path d={d} fill="none" stroke="url(#place-g)" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
  const card = (x: number, y: number) => (
    <>
      <rect x={x} y={y} width="96" height="34" rx="8" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.1)" />
      <circle cx={x + 18} cy={y} r="7" fill="#15131f" stroke="rgba(255,255,255,.14)" />
      <circle cx={x + 18} cy={y} r="3.4" fill="url(#place-core)" />
      <rect x={x + 12} y={y + 14} width="56" height="5" rx="2.5" fill="rgba(255,255,255,.18)" />
      <rect x={x + 12} y={y + 23} width="38" height="4" rx="2" fill="rgba(255,255,255,.1)" />
    </>
  );
  return (
    <svg viewBox="0 0 240 132" aria-hidden="true">
      <defs>
        <linearGradient id="place-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#9D86FF" />
          <stop offset="1" stopColor="#4CD6FF" />
        </linearGradient>
        <radialGradient id="place-core">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#9D86FF" />
        </radialGradient>
      </defs>
      {kind === "visible" ? (
        <>
          <rect x="132" y="18" width="80" height="28" rx="8" fill="rgba(157,134,255,.14)" stroke="#9D86FF" strokeWidth="1.5" />
          {light("M 54 82 C 60 50, 150 70, 172 47")}
          {card(36, 82)}
        </>
      ) : null}
      {kind === "offscreen" ? (
        <>
          <ellipse cx="170" cy="132" rx="54" ry="18" fill="#9D86FF" opacity=".35" />
          <path d="M164 116 170 122 176 116" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          {light("M 54 54 C 70 90, 150 90, 170 128")}
          {card(36, 20)}
        </>
      ) : null}
      {kind === "otherScreen" ? (
        <>
          <rect x="0" y="0" width="60" height="132" fill="rgba(255,255,255,.025)" />
          <rect x="10" y="22" width="40" height="8" rx="4" fill="rgba(255,255,255,.12)" />
          <rect x="6" y="40" width="48" height="18" rx="6" fill="rgba(157,134,255,.14)" stroke="#9D86FF" strokeWidth="1.5" />
          <rect x="10" y="68" width="40" height="8" rx="4" fill="rgba(255,255,255,.12)" />
          {light("M 116 82 C 100 60, 90 50, 56 49")}
          {card(98, 82)}
        </>
      ) : null}
      {kind === "notFound" ? (
        <>
          <rect x="132" y="18" width="80" height="28" rx="8" fill="none" stroke="rgba(255,255,255,.25)" strokeDasharray="4 4" />
          <text x="172" y="36" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.4)" fontFamily="var(--mono)">
            ?
          </text>
          {card(36, 70)}
        </>
      ) : null}
    </svg>
  );
}

const PLACES = [
  { kind: "visible", title: "Right there", text: "The tour points straight at it, wherever your layout happens to put it." },
  { kind: "offscreen", title: "Further down the page", text: "The tour shows which way to scroll, and Show me takes you to it." },
  { kind: "otherScreen", title: "On another page", text: "The tour lights up the link, and Take me there goes to that page." },
  { kind: "notFound", title: "Not on screen", text: "The tour says so plainly and lets you move on. It never points at empty space." },
] as const;

function Places() {
  const ladder = useTarget<HTMLDivElement>("ladder", { radius: 20 });
  return (
    <section className="section" id="places">
      <div className="container">
        <div className="section-head">
          <span className="label">Why it keeps working</span>
          <h2>Tours that don't break when your app moves.</h2>
          <p>
            Hintbeam checks where the element is right now — when a step appears, when the page scrolls, and when the element itself mounts
            late. Wherever it turns out to be, the tour knows what to do.
          </p>
        </div>
        <div ref={ladder} className="places">
          {PLACES.map((p, i) => (
            <div key={p.kind} className="place">
              <div className="place-art">
                <PlaceArt kind={p.kind} />
              </div>
              <h3>
                <span className="n">{i + 1}</span>
                {p.title}
              </h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ——— Why it's different ——— */

function Different() {
  return (
    <section className="section" id="why">
      <div className="container">
        <div className="section-head">
          <span className="label">Why Hintbeam</span>
          <h2>Tours bound to names you own, not to your markup.</h2>
          <p>
            Tours are often glued to CSS selectors and page layouts, so a renamed class or a moved button breaks them. Hintbeam tours point
            at names in a contract your app keeps, so the app can change underneath them.
          </p>
        </div>
        <div className="why-grid">
          <div className="cell">
            <span className="why-n">01</span>
            <h3>A contract between your app and its tours</h3>
            <p>
              <code>defineTargets</code> lists what tours may point at. Any component opts in with one ref, wherever it lives. Restyle it,
              rename its classes or move it to another page: the tour still finds it.
            </p>
            <div className="art">
              <Code
                title="contract → any component"
                code={`const targets = defineTargets({
  exportButton: { screen: "/reports" },
});

// anywhere in your app
<Button ref={useTarget("exportButton")}>Export</Button>`}
              />
            </div>
          </div>
          <div className="cell">
            <span className="why-n">02</span>
            <h3>Any screen, any platform</h3>
            <p>
              Tours don't know about pages, layouts or devices; targets do. One tour crosses routes, tabs and layouts, and the same tour
              runs on the web and in React Native (preview). Adapters for Next.js, React Router, Expo Router and React Navigation, or your
              own router in a few lines.
            </p>
            <div className="art event-lines">
              <div>
                <b>/dashboard</b> · sidebar or tab bar
              </div>
              <div>
                <b>/reports</b> · Take me there<span className="ok">✓</span>
              </div>
              <div>
                one tour · <b>web</b> + <b>React Native</b>
              </div>
            </div>
          </div>
          <div className="cell">
            <span className="why-n">03</span>
            <h3>Tours are typed data</h3>
            <p>
              Point a step at a name that isn't in the contract and TypeScript stops you as you type. Tours that arrive as JSON, from a CMS
              or your API, get the same check at runtime, with a "did you mean…?". Ship a new tour without a deploy.
            </p>
            <div className="art">
              <div className="editor">
                <div>
                  steps: [{"{"} target: <span className="s squiggle">"exportButon"</span> {"}"}]
                </div>
                <div className="hint-pop">
                  "exportButon" is not a declared target. Did you mean <b>"exportButton"</b>?
                </div>
              </div>
            </div>
          </div>
          <div className="cell">
            <span className="why-n">04</span>
            <h3>Your UI, or ours</h3>
            <p>
              Use the built-in card and theme it to your brand, render your own card, or go fully headless. Every decision lives in a core
              with zero dependencies and no React, so new platforms and renderers sit on the same engine.
            </p>
            <div className="art">
              <Code
                title="three levels"
                code={`<TourProvider theme={createTourTheme({ brand })} />
<TourProvider renderStep={(step) => <MyCard step={step} />} />
const step = useTourStep(); // headless`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ——— Features ——— */

function PathPreview({ name, from, to }: { name: TourPathName; from: string; to: string }) {
  const route = TOUR_PATHS[name]({ x: 22, y: 96 }, { x: 128, y: 14, width: 48, height: 22 }, { gap: 5, leave: { x: 0, y: -1 } });
  const id = `preview-${name}`;
  return (
    <svg viewBox="0 0 190 116" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect x="128" y="14" width="48" height="22" rx="6" className="path-target" style={{ stroke: from }} />
      <rect x="8" y="96" width="54" height="14" rx="4" className="path-card" />
      <circle cx="22" cy="96" r="5" fill={from} />
      {route.strands?.map((s, i) => (
        <path key={i} d={s.d} pathLength={1} className="path-strand" style={{ stroke: `url(#${id})` }} />
      ))}
      <path d={route.d} pathLength={1} className="path-line" style={{ stroke: `url(#${id})` }} />
    </svg>
  );
}

function Features() {
  const { settings, update } = useSettings();
  const tour = useTour();
  const theme = themeFor(settings);
  const pathName: TourPathName = theme.path && theme.path in TOUR_PATHS ? (theme.path as TourPathName) : "wave";
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <span className="label">What you get</span>
          <h2>Everything else a good tour needs.</h2>
          <p>Steps that wait for the user, a look that matches your product, events for your analytics, and care for every user.</p>
        </div>
        <div className="bento">
          <div className="cell span-2">
            <h3>Steps that wait for the user</h3>
            <p>
              A step can wait for a real tap, for a page to open, or for your app to finish something. A timeout makes sure nobody gets
              stuck.
            </p>
            <div className="art event-lines">
              <div>
                advanceOn: <b>"tap"</b>
              </div>
              <div>
                advanceOn: <b>"arrive"</b>
              </div>
              <div>
                emit(<b>"report.exported"</b>)<span className="ok">✓</span>
              </div>
            </div>
          </div>
          <div className="cell span-4">
            <h3>Fits your product</h3>
            <p>Pick how much is going on and use your brand colour. Every tour on this site changes as you choose — the demo above too.</p>
            <div className="art">
              <div className="fit-row" role="radiogroup" aria-label="Style">
                {(Object.keys(STYLES) as TourStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    role="radio"
                    className="chip"
                    aria-checked={settings.style === style}
                    aria-pressed={settings.style === style}
                    onClick={() => update({ style, path: null, glow: null, backdrop: null, guide: null, radius: presetRadius(style) })}
                  >
                    {STYLES[style].name}
                  </button>
                ))}
              </div>
              <div className="fit-preview">
                <PathPreview name={pathName} from={theme.accent} to={theme.accent2} />
                <div className="swatches">
                  {BRANDS.slice(0, 7).map((b) => (
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
                </div>
              </div>
              <div className="fit-actions">
                <button type="button" className="btn btn-sm" onClick={() => void tour.start(siteTour)}>
                  <PlayIcon /> Replay the tour
                </button>
                <Link href="/playground" className="link-button">
                  More options in the playground →
                </Link>
              </div>
            </div>
          </div>
          <div className="cell span-3">
            <h3>Know what people do</h3>
            <p>
              Every start, step, skip and finish is an event you can send to your analytics. Plugins add more — audiences, tours loaded from
              your server, new line styles.
            </p>
            <div className="art event-lines">
              <div>
                <b>start</b> first-meal
              </div>
              <div>
                <b>step</b> 2 · tap
              </div>
              <div>
                <b>complete</b> first-meal<span className="ok">✓</span>
              </div>
            </div>
          </div>
          <div className="cell span-3">
            <h3>Considerate by default</h3>
            <ul className="check-list art">
              <li>
                <CheckIcon /> Read out once by screen readers
              </li>
              <li>
                <CheckIcon /> Never steals focus or blocks a tap
              </li>
              <li>
                <CheckIcon /> Keyboard: ← → and Esc
              </li>
              <li>
                <CheckIcon /> Calmer for people who prefer less motion
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ——— How it works ——— */

function How({ agentPrompt }: { agentPrompt: string }) {
  const [active, setActive] = useState(0);
  const step = HOW[active]!;
  return (
    <section className="section" id="how">
      <div className="container">
        <div className="section-head">
          <span className="label">Get started</span>
          <h2>Your first tour in four steps.</h2>
          <p>
            Copy, paste, adjust. The <Link href="/docs/getting-started">getting-started guide</Link> covers every router and option.
          </p>
        </div>
        <div className="how">
          <div className="how-steps" role="tablist" aria-label="Setup steps">
            {HOW.map((h, i) => (
              <button key={h.title} type="button" role="tab" className="how-step" aria-selected={i === active} onClick={() => setActive(i)}>
                <span className="n">{i + 1}</span>
                <strong>{h.title}</strong>
                <span>{h.text}</span>
              </button>
            ))}
          </div>
          <CodeTabs key={active} tabs={step.tabs} />
        </div>
        <div className="agent-prompt">
          <div>
            <h3>Or let your coding agent do it.</h3>
            <p>
              Paste this into Claude Code, Cursor, Copilot or any coding agent. It reads the full docs from{" "}
              <a href={`${BASE_PATH}/llms-full.txt`}>llms-full.txt</a> and does the four steps in your app.
            </p>
          </div>
          <Code code={agentPrompt} language="text" title="Prompt for your coding agent" wrap />
        </div>
      </div>
    </section>
  );
}

/* ——— Questions ——— */

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Is it free?",
    a: "Yes. It's MIT-licensed, so you can use it in commercial products. There are no keys, no accounts and no tracking.",
  },
  {
    q: "Will the tour cover or block my app?",
    a: (
      <>
        No. The page stays usable the whole time — people can tap the real button a step is about. The dimmed background never blocks
        clicks, and you can turn it off with <code>backdrop: 0</code>.
      </>
    ),
  },
  {
    q: "Which frameworks and routers does it work with?",
    a: (
      <>
        React 18 and up, Next.js (App Router), Vite, Remix, React Native 0.73 and up, and Expo. There are ready-made adapters for Next.js,
        React Router, Expo Router and React Navigation, and any other router takes two lines with <code>useRouterAdapter</code>. No router
        at all is fine too.
      </>
    ),
  },
  {
    q: "Does it work with Next.js server components?",
    a: (
      <>
        Yes. Its components are marked <code>"use client"</code>. Put the provider in a client component, as in the Next.js example above,
        and keep the rest of your layout on the server.
      </>
    ),
  },
  {
    q: "Can I make it look like my product?",
    a: (
      <>
        Yes, as much as you like. <code>createTourTheme</code> sets your brand colour and one of four styles, from Aurora to Minimal. Every
        colour, corner and effect can be changed on its own. For a completely different look, render your own card with{" "}
        <code>renderStep</code> or the headless <code>useTourStep</code> hook.
      </>
    ),
  },
  {
    q: "Can someone change a tour without a code change?",
    a: (
      <>
        Tours are plain data, so you can load them from your CMS or database. <code>parseTour</code> checks them before they play, with
        clear messages for mistakes. A hosted visual editor is on the roadmap but isn't available yet.
      </>
    ),
  },
  {
    q: "What happens if a step's element isn't there?",
    a: "The step says it can't find it right now and lets the person carry on. During development, you also get a console warning naming the element, so you can fix the tour.",
  },
  {
    q: "Does it remember where people got to?",
    a: (
      <>
        Yes. Skipping pauses a tour, and it can pick up where it left off. Keep progress in <code>localStorage</code>, React Native's
        AsyncStorage, or your own server.
      </>
    ),
  },
  {
    q: "Can I translate it?",
    a: (
      <>
        Yes. Every word the tour shows — Next, Back, Skip and the rest — comes from <code>labels</code>, and the step text is your own
        content. The playground has Spanish and Hindi examples.
      </>
    ),
  },
  {
    q: "Is it accessible?",
    a: "Each step is read out once by screen readers, focus is never moved, the keyboard works (← → and Esc), and motion calms down for people who ask their device for less. Screen-reader testing on real phones is still on the roadmap, and we'll say so until it's done.",
  },
];

function Questions() {
  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head">
          <span className="label">Questions</span>
          <h2>Questions people ask first.</h2>
        </div>
        <div className="faq">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <div className="faq-answer">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ——— Open source ——— */

const ROADMAP: ["shipped" | "next" | "later", string][] = [
  [
    "shipped",
    "Tours that find their target and follow people across pages, with adapters for Next.js, React Router, Expo Router and React Navigation",
  ],
  ["shipped", "Five line styles, four looks, brand colours, translations, and a headless hook for your own UI"],
  ["shipped", "Plugins for analytics, audiences, tours from your server and custom line styles"],
  ["next", "Testing on real iPhones and Android phones, including screen readers"],
  ["next", "A Next.js example app, and the first release on npm"],
  ["later", "Checklists, hotspots and announcements"],
  ["later", "A hosted editor and analytics for teams, built on the same open plugins"],
];

function OpenCore() {
  return (
    <section className="section" id="open-source">
      <div className="container">
        <div className="section-head">
          <span className="label">Open source</span>
          <h2>Yours to read, fork and depend on.</h2>
          <p>MIT, with no keys, no telemetry and nothing that phones home. Versioned with care, so upgrading is never a gamble.</p>
        </div>
        <div className="oss-grid">
          <div className="oss-card">
            <h3>How it is run</h3>
            <p>The promises behind every release.</p>
            <ul className="policy">
              <li>
                <b>Semantic versioning, written down</b>
                Breaking changes only in a major release, after at least one minor release of deprecation warnings.{" "}
                <Link href="/docs/versioning">Read the policy</Link>
              </li>
              <li>
                <b>A changelog for every release</b>
                Each change says what it means for you, with the upgrade step when one is needed.{" "}
                <Link href="/docs/changelog">Changelog</Link>
              </li>
              <li>
                <b>A guarded public API</b>
                Every export is snapshotted in CI. Nothing is renamed or removed by accident.
              </li>
              <li>
                <b>Plugins have their own version</b>
                <code>TOUR_PLUGIN_API_VERSION</code> lets add-ons say what they were built for.
              </li>
            </ul>
          </div>
          <div className="oss-card">
            <h3>Roadmap</h3>
            <p>What exists, what is next, and what may come later.</p>
            <ul className="roadmap">
              {ROADMAP.map(([status, text]) => (
                <li key={text}>
                  <span className={`status ${status}`}>{status}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
