---
title: "How to add a product tour to a Next.js App Router app"
description: "Step-by-step: add a product tour to a Next.js App Router app with hintbeam. Client provider, tagged elements, first-visit tours and brand colours."
date: "2026-10-08"
author: "Hintbeam team"
tags: ["nextjs", "app-router", "tutorial", "product-tours", "onboarding"]
---

This tutorial adds a four-step welcome tour to a Next.js App Router app. By the end you will have:

- a client provider that lets the tour follow users between pages;
- elements tagged with hooks, without wrapping or moving anything;
- a "Show me around" button;
- a tour that plays automatically on the first visit and not after it's finished;
- the tour in your brand colour.

It uses [Hintbeam](https://github.com/CypherRatHQ/hintbeam), an MIT-licensed library for product tours and guided flows in React, Next.js and React Native. You need Next.js 13.4 or later with the App Router, and React 18 or later.

The example app has a dashboard at `/dashboard`, a team page at `/settings/team`, and a header on every page.

## 1. Install

```sh
npm install hintbeam
```

`hintbeam` gives you the browser build in Next.js automatically. The Next.js router adapter is in `hintbeam/next`.

## 2. Declare targets and write the tour

A **target** is a name for something a tour can point at. You declare them once, with the screen each one lives on. With the App Router, a screen is a pathname.

```ts
// app/tour-data.ts
import { defineTargets, defineTour } from "hintbeam/core";

export const targets = defineTargets({
  search:     { screen: "/dashboard",     about: "The project search box" },
  newProject: { screen: "/dashboard",     about: "The New project button" },
  invite:     { screen: "/settings/team", about: "The Invite teammates button" },
  help:       {                           about: "The ? button in the header, on every page" },
});

export const welcome = defineTour(targets, {
  id: "welcome",
  steps: [
    { target: "search", title: "Find anything", text: "Search every project by name or owner." },
    { target: "newProject", title: "Start here", text: "Create your first project. Go on, click it.", advanceOn: "tap" },
    { target: "invite", title: "Bring your team", text: "Invite teammates from the team settings page." },
    { target: "help", text: "You can replay this tour from here any time." },
  ],
});

declare module "hintbeam" {
  interface Register {
    targets: typeof targets;
  }
}
```

A few things to note:

- **`help` has no `screen`.** That means it's drawn on every page, like a header button.
- **`about` is a note for whoever writes tours.** Users never see it.
- **Step 2 uses `advanceOn: "tap"`.** The step ends when the user clicks the real button.
- **The `declare module` block registers your targets.** It gives `useTarget` autocomplete, and makes a misspelt name a compile error everywhere.
- **This file imports from `hintbeam/core`.** That's the engine without React. It has no `"use client"` boundary, so this file is safe to import from both server and client components.

`defineTour` also checks the tour when it runs: 1–8 steps, titles up to 60 characters and text up to 160. If anything is wrong, you get a readable error with a "did you mean…?" hint.

## 3. Add a client provider

`TourProvider` uses hooks, so it lives in a client component. The `useNextRouter()` adapter tells the tour which page is in front, and how to get to another one.

```tsx
// app/tours.tsx
"use client";

import type { ReactNode } from "react";
import { TourProvider, browserTourStorage, createTourTheme } from "hintbeam";
import { useNextRouter } from "hintbeam/next";
import { targets } from "./tour-data";

// Remember progress in localStorage. Safe during server rendering: localStorage is only
// touched in the browser, when progress is loaded or saved.
const storage = browserTourStorage();

const theme = createTourTheme({ brand: "#0E7C66", mode: "light", style: "balanced" });

export function Tours({ children }: { children: ReactNode }) {
  return (
    <TourProvider targets={targets} router={useNextRouter()} storage={storage} theme={theme}>
      {children}
    </TourProvider>
  );
}
```

About `storage`: without it, progress lives in memory and is lost on reload. `browserTourStorage()` keeps it in `localStorage`, and never throws: if storage is blocked or full, progress is simply not kept. It's made for Next.js, where client components are still rendered on the server and `localStorage` doesn't exist there.

Then wrap your app in the root layout. The layout stays a server component:

```tsx
// app/layout.tsx
import type { ReactNode } from "react";
import { Header } from "./header";
import { Tours } from "./tours";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Tours>
          <Header />
          {children}
        </Tours>
      </body>
    </html>
  );
}
```

## 4. Tag the elements

`useTarget(name)` returns a ref. Attach it to something you already render. Nothing is wrapped, and the layout doesn't change. Hooks need a client component, so put the tagged elements in small client components and keep your pages as they are.

```tsx
// app/dashboard/toolbar.tsx
"use client";

import { useTarget } from "hintbeam";

export function Toolbar({ onNewProject }: { onNewProject: () => void }) {
  const search = useTarget("search", { radius: 8 });
  const newProject = useTarget("newProject", { radius: 8 });

  return (
    <div className="toolbar">
      <input ref={search} type="search" placeholder="Search projects" />
      <button ref={newProject} onClick={onNewProject}>
        New project
      </button>
    </div>
  );
}
```

```tsx
// app/settings/team/invite-button.tsx
"use client";

import { useTarget } from "hintbeam";

export function InviteButton() {
  const invite = useTarget("invite", { radius: 8 });
  return <button ref={invite}>Invite teammates</button>;
}
```

`radius` is the element's corner radius, so the highlight ring follows its shape.

## 5. Start the tour, and mark the way between pages

The header is on every page. It holds the `help` target, a "Show me around" button, and the link to the team page:

```tsx
// app/header.tsx
"use client";

import Link from "next/link";
import { useScreenLink, useTarget, useTour } from "hintbeam";
import { welcome } from "./tour-data";

export function Header() {
  const help = useTarget("help", { radius: 999 });
  const teamLink = useScreenLink("/settings/team");
  const { start } = useTour();

  return (
    <header>
      <Link href="/dashboard">Dashboard</Link>
      <Link ref={teamLink} href="/settings/team">Team</Link>
      <button ref={help} aria-label="Show me around" onClick={() => start(welcome)}>
        ?
      </button>
    </header>
  );
}
```

`start(welcome)` plays the tour from the first step. Step 3's target is on `/settings/team`, so when the user reaches it from the dashboard, the card offers **Take me there**. Because the Team link is marked with `useScreenLink`, the tour points at the link first, so the user learns where the page is. "Take me there" still works without a marked link; there's just nothing to highlight.

`start` resolves to a result: `"started"`, `"already-playing"`, `"blocked"` (by a plugin) or `"unknown-tour"`. `startOnce` can also resolve to `"seen"`. You can ignore it, or use it in tests.

## 6. Show it on the first visit only

To show the tour automatically on the first visit, call `startOnce`. It plays the tour only if this user has never finished or skipped it, so it's safe to call on every visit:

```tsx
// app/dashboard/first-visit.tsx
"use client";

import { useEffect } from "react";
import { useTour } from "hintbeam";
import { welcome } from "../tour-data";

export function FirstVisitTour() {
  const { startOnce } = useTour();
  useEffect(() => {
    void startOnce(welcome);
  }, [startOnce]);
  return null;
}
```

Render it on the page where the tour should begin:

```tsx
// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { FirstVisitTour } from "./first-visit";
import { Toolbar } from "./toolbar";

export default function DashboardPage() {
  const [creating, setCreating] = useState(false);
  return (
    <main>
      <FirstVisitTour />
      <Toolbar onNewProject={() => setCreating(true)} />
      {creating && <p>Your new project dialog goes here.</p>}
    </main>
  );
}
```

Two things make this work:

- **The `storage` from step 3.** Progress is remembered per tour, so with storage the tour stays seen across reloads. Without it, every reload counts as a first visit.
- **`startOnce` waits for saved progress before deciding.** So it gives the right answer on page load, whether your storage is synchronous like `localStorage` or asynchronous.

"Seen" means finished or skipped. Someone who skips the welcome tour has said "not now", so it doesn't reopen by itself. The help button from step 5 still plays it at any time, because `start` always plays from the first step, and `resume(welcome)` picks up where they skipped.

The help button from step 5 still replays the tour at any time, because `start` always plays from the first step.

## 7. Match your brand

`createTourTheme` builds a full theme from your brand colour, a mode and a style:

```ts
import { createTourTheme } from "hintbeam";

const theme = createTourTheme({ brand: "#0E7C66", mode: "light", style: "balanced" });
```

- **`brand`** is your colour. The light, the highlight and the main button are made from it. The light blends into a neighbouring hue, and button text turns dark on light brand colours.
- **`mode`** is `"light"` or `"dark"` cards.
- **`style`** sets how much is going on:

| `style` | Looks like |
| --- | --- |
| `"aurora"` | Three strands of light, the guide, a soft glow and a spotlight |
| `"balanced"` (default) | The guide and a single wave, softly lit |
| `"subtle"` | A thin straight line and a quiet card. No guide, and nothing keeps moving |
| `"minimal"` | An outline and a card beside it, like a tooltip. No light and no dimming |

A few variations:

```ts
import { createTourTheme } from "hintbeam";

// A flat light in one colour: pass the same colour twice.
export const flat = createTourTheme({ brand: "#0E7C66", brand2: "#0E7C66" });

// Dark cards, and the quietest style that still draws a light.
export const quiet = createTourTheme({ brand: "#0E7C66", mode: "dark", style: "subtle" });

// Anything else, last.
export const custom = createTourTheme({
  brand: "#0E7C66",
  style: "balanced",
  overrides: { radius: 8, glow: 0.3, fontFamily: "var(--font-inter)", inset: { top: 72 } },
});
```

`inset.top` keeps cards below a sticky header. `glow` is one dial, from 0 to 1, for every glow. Anyone with reduced motion switched on gets a still light whatever you choose. Every option is listed in [Customising](https://github.com/CypherRatHQ/hintbeam/blob/main/docs/customising.md).

Keep the theme outside the component, as above, or memoise it, so it isn't rebuilt on every render.

## What you have now

- A welcome tour that plays on the first visit to `/dashboard`, and stays closed once it has been finished or skipped.
- A step that waits for the user to click the real button.
- A step on another page, reached through **Take me there**, with the link highlighted.
- A help button that replays it, in your brand colour.

## Next steps

- **Wire it to analytics:** pass `onEvent` to `TourProvider` to receive every start, step, complete, skip and stop.
- **Wait for your app:** `advanceOn: { event: "project.created" }` ends a step when you call `emit("project.created")`.
- **Translate:** every word users read comes from `labels`.
- **Dynamic routes:** screens match exactly for now, so declare the path the user will be on, or build the tour at runtime. Pattern matching (`/projects/:id`) is planned.

The full API is in the [API reference](https://github.com/CypherRatHQ/hintbeam/blob/main/docs/api.md). If something in this tutorial doesn't work for you, please [open an issue](https://github.com/CypherRatHQ/hintbeam/issues).
