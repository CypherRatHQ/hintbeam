# Hintbeam

**To add a product tour to a React, Next.js or React Native app, install `hintbeam`, name the
elements a tour may point at, and start a typed tour from any component.** Hintbeam is an MIT-licensed
library for product tours and guided flows: steps find their own elements, follow users across pages,
and never point at empty space when the app scrolls or moves.

> **Status: early (0.x).** Ready to use; the API may still change before 1.0, and every change is in
> the [changelog](CHANGELOG.md). React Native support is a **preview**: it type-checks and shares the
> tested core, but has not yet been run on a real iOS or Android device.

```sh
npm install hintbeam
```

## Quick start (30 seconds)

```tsx
import { TourProvider, defineTargets, defineTour, useTarget, useTour } from "hintbeam";

// 1. Name the things a tour may point at.
const targets = defineTargets({
  search: { about: "The search box" },
  save: { about: "The Save button" },
});

// 2. Write the tour as data. A misspelt target name will not compile.
const firstRun = defineTour(targets, {
  id: "first-run",
  steps: [
    { target: "search", title: "Find anything", text: "Search everything you have saved." },
    { target: "save", text: "Save your work here. Try it now.", advanceOn: "tap" },
  ],
});

// 3. Tag elements you already render. Nothing is wrapped, nothing moves.
function Toolbar() {
  const search = useTarget("search");
  const save = useTarget("save");
  const { start } = useTour();
  return (
    <div>
      <input ref={search} placeholder="Search" />
      <button ref={save}>Save</button>
      <button onClick={() => start(firstRun)}>Show me around</button>
    </div>
  );
}

// 4. Wrap your app once.
export default function App() {
  return (
    <TourProvider targets={targets}>
      <Toolbar />
    </TourProvider>
  );
}
```

Press **Show me around**: the first step points at the search box. The second waits until the user
clicks the real Save button. On React Native it is the same code, with `<TextInput ref={search} />`
and `<Pressable ref={save}>`.

## Why Hintbeam

- **A contract, not selectors.** `defineTargets` lists what tours may point at, and any component opts
  in with one ref: `ref={useTarget("exportButton")}`. Restyle a component, rename its classes or
  move it to another page, and the tour still finds it.
- **Any screen, any platform.** Targets know which screen they live on; tours don't. One tour crosses
  routes, tabs and layouts, and the same tour runs on the web and in React Native (preview).
- **Typed data.** A misspelt target is a compile error. Tours loaded as JSON, from a CMS or your API,
  get the same check at runtime with a "did you mean…?", so you can ship a tour without a deploy.
- **Your UI, or ours.** Theme the built-in card to your brand, render your own, or go headless. The
  engine (`hintbeam/core`) has zero dependencies and no React.

Every time a step shows, and whenever something moves, Hintbeam measures where the element **is**:

| The target is… | The tour… |
| --- | --- |
| on screen | points at it with a light that travels from the card |
| scrolled away | offers **Show me**, and scrolls it into view |
| on another page | highlights the way there and offers **Take me there** |
| nowhere yet | says so, and finds it the moment it renders; it never points at nothing |

## Across pages

Give each target the screen it lives on, and pass a router adapter. Steps whose target is on another
page then offer **Take me there**:

```tsx
// tour-data.ts
import { defineTargets, defineTour } from "hintbeam/core";

export const targets = defineTargets({
  search: { screen: "/food", about: "The search box" },
  logMeal: { screen: "/food" },
  weight: { screen: "/progress" },
});

export const firstMeal = defineTour(targets, {
  id: "first-meal",
  steps: [
    { target: "search", title: "Find food", text: "Search anything you ate." },
    { target: "logMeal", text: "Log it with one tap.", advanceOn: "tap" },
    { target: "weight", text: "Your progress lives here." },
  ],
});
```

```tsx
// tours.tsx — Next.js App Router
"use client";
import type { ReactNode } from "react";
import { TourProvider } from "hintbeam";
import { useNextRouter } from "hintbeam/next";
import { targets } from "./tour-data";

export function Tours({ children }: { children: ReactNode }) {
  return <TourProvider targets={targets} router={useNextRouter()}>{children}</TourProvider>;
}
```

Leave `screen` out for things shown on every page, such as a header button.

## Works where your app does

| | Import |
| --- | --- |
| React and Next.js (browser) | `hintbeam` — picked automatically |
| React Native and Expo (preview) | `hintbeam` — picked automatically |
| Next.js App Router | `useNextRouter()` from `hintbeam/next` |
| React Router 6/7, Remix | `useReactRouter()` from `hintbeam/react-router` |
| Expo Router | `useExpoRouter()` from `hintbeam/expo-router` |
| React Navigation | `useReactNavigation(ref)` from `hintbeam/react-navigation` |
| Any other router | `useRouterAdapter(screen, navigate)` |
| Servers, CMS, CI (no React) | `hintbeam/core` |

Supported versions: React ≥ 18, Next.js ≥ 13.4 (App Router), React Native ≥ 0.73 with
`react-native-svg` ≥ 13, React Router ≥ 6, Expo Router ≥ 3, React Navigation ≥ 6.

## What else

- **Steps that wait for your app:** `advanceOn: { event: "report.exported" }`, then call `emit("report.exported")`.
- **One tour, every size:** tag a phone tab bar and a desktop sidebar with the same name.
- **A companion, not a modal:** nothing is covered; tapping the real button can be the step.
- **Styles and brand colour:** `createTourTheme({ brand: "#E5484D", style: "balanced" })`, with styles from `aurora` (three strands of light, a glow and a spotlight) to `minimal` (an outline and a card, like a tooltip).
- **Path styles:** `wave`, `strands` (three lines of light), `straight`, `elbow`, `arc` — or write your own in a few lines.
- **A guide with a personality:** a small living light on the card's edge that leans toward the target, waits with you, and searches when something isn't there.
- **Follows the page:** the card sits beside its target and, with the light and the spotlight, tracks it every frame while anything scrolls (on the web; on React Native it measures again when a scroll comes to rest).
- **Themes and translations** for every word users read; or render your own card, or go fully headless.
- **Progress:** remembers each user's step, skips and completions; `resume(tour)` picks up where they left off.
- **Plugins:** analytics, audiences, tours from a CMS, live preview — through a small, versioned API.
- **Accessible:** announced once, no focus theft, keyboard shortcuts, reduced motion respected.
- **Small, tested core:** zero runtime dependencies; every rule unit-tested without a screen.

## Documentation

- [Getting started](docs/getting-started.md) — React, Next.js, Expo, React Navigation
- [Concepts](docs/concepts.md) · [Customising](docs/customising.md) · [Routers](docs/routers.md)
- [Plugins](docs/plugins.md) · [API reference](docs/api.md) · [Architecture](docs/architecture.md) · [Accessibility](docs/accessibility.md)
- [Versioning](docs/versioning.md) — what semver promises here, and how releases are made

Tutorials:

- [How to add a product tour to a Next.js App Router app](site/content/blog/nextjs-app-router-product-tour.md)
- [React Native onboarding tour with Expo Router or React Navigation](site/content/blog/react-native-onboarding-tour.md) (preview)
- [Why product tours break, and how Hintbeam handles it](site/content/blog/why-product-tours-break.md)

The website in [`site/`](site) (Next.js, static export) is built with Hintbeam itself:

```sh
cd site && npm install && npm run lib && npm run dev
```

## Questions

**Does it work with the Next.js App Router?** Yes. Put `TourProvider` in a `"use client"` component,
pass `useNextRouter()` from `hintbeam/next`, and wrap your root layout with it.

**Can I show a tour only on the first visit?** Yes: `startOnce(tour)` plays it only if this user
has never finished or skipped it. It waits for saved progress first, so it works with any storage,
including React Native's AsyncStorage. Pass `storage` so progress survives reloads; see
[Getting started](docs/getting-started.md#6-start-it).

**Can tours come from a CMS or JSON?** Yes. `parseTour(json, targets)` validates them and never
throws; a plugin's `tours()` can supply them at runtime.

**Does it block the page?** No. The card never covers or blocks your app; the rest of the screen may
dim slightly (`backdrop: 0` turns that off).

**Does it work with Jest?** Yes. Hintbeam is published as ES modules, so add it to Jest's
`transformIgnorePatterns` allow-list; see [Getting started](docs/getting-started.md#testing-your-app).
Vitest needs nothing.

**Is there a paid version?** Not yet. The library is MIT and stays MIT. A separate Pro package and a
hosted editor may come later; they would plug in through the same public plugin API, and the library
never checks a licence key or phones home.

## Licence

MIT — every platform, router, path style and the plugin API. See [`LICENSE`](LICENSE).
