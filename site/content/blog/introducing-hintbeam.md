---
title: "Introducing Hintbeam: product tours for React, Next.js and React Native"
description: "Hintbeam is an MIT product-tour library for React, Next.js and React Native. Tours find their elements, follow users across pages, and are typed data."
date: "2026-10-08"
author: "Hintbeam team"
tags: ["announcement", "react", "nextjs", "react-native", "product-tours"]
---

Hintbeam is an open-source library for adding product tours to React, Next.js and React Native apps. You install one package, `hintbeam`, name the things a tour can point at, write the tour as data, and start it from any component. It is MIT licensed.

## Why another tour library

Product tours look simple: a card next to a button, then the next one. In a real app, small things go wrong:

- The button is further down the page, so the card points at empty space.
- The page scrolls while a step is showing, and the highlight stays where the button *was*.
- The next step's element is on a different page.
- The element isn't on screen at all, because of a feature flag or a narrow viewport.

Hintbeam is built around one rule: **measure, never remember**. Every time a step shows, and every time something moves (a navigation, a scroll settling, a resize), the tour measures where its element is right now. There are four possible answers, each with its own honest UI:

| Where the element is | What the user sees |
| --- | --- |
| On this screen, in view | The light and a highlight ring point at it |
| On this screen, scrolled away | A **Show me** button scrolls it into view |
| On another screen | The link to that screen is highlighted, with **Take me there** |
| Not on screen anywhere | The card says so and offers Next. It never points at nothing |

There's more on these in [Why product tours break](/blog/why-product-tours-break).

## A light from the card to the element

Each card has a small living light on its edge, which we call the guide. A line of light leaves the guide and travels to the element the step is about. On the web, the card, the light and the highlight follow the element every frame while anything scrolls. On React Native they measure again when a scroll comes to rest.

Not every product wants that much going on, so there are four styles:

- **`aurora`**: three strands of light, the guide, a soft glow and a spotlight. Good for a launch moment.
- **`balanced`** (the default): the guide and a single wave, softly lit.
- **`subtle`**: a thin straight line and a quiet card. No guide, and nothing keeps moving.
- **`minimal`**: an outline around the element and a card beside it, like a tooltip. No light and no dimming.

You give it your brand colour, and the light, the highlight and the main button are made from it:

```tsx
import { TourProvider, createTourTheme } from "hintbeam";

const theme = createTourTheme({ brand: "#E5484D", mode: "light", style: "subtle" });

<TourProvider targets={targets} theme={theme}>{/* your app */}</TourProvider>;
```

Glow and motion each have one dial. Anyone with reduced motion switched on gets a still light. To draw your own card, pass `renderStep`, or go fully headless with `useTourStep()`.

## Tours are typed data

You declare the things a tour may point at once, as **targets**:

```ts
import { defineTargets, defineTour } from "hintbeam";

export const targets = defineTargets({
  search:  { screen: "/food",     about: "The food search box" },
  logMeal: { screen: "/food",     about: "The button that logs a meal" },
  weight:  { screen: "/progress", about: "This week's weight chart" },
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

Then you attach a target to something you already render. It's just a ref, so nothing is wrapped and nothing moves:

```tsx
const search = useTarget("search");
return <input ref={search} placeholder="Search" />;
```

Because targets are declared, mistakes get caught early. Misspell a target in TypeScript and it doesn't compile:

```
Type '"serch"' is not assignable to type '"search" | "logMeal" | "weight"'. Did you mean '"search"'?
```

Tours you load as JSON, say from a CMS, go through `parseTour`. It never throws, and it gives you readable problems instead:

```
steps[0].target: "serch" is not a declared target. Did you mean "search"?
```

A step ends when the user taps Next, taps the highlighted element itself (`"tap"`), or reaches the target's screen (`"arrive"`). It can also wait for your app: with `advanceOn: { event: "report.exported" }`, it ends when you call `emit("report.exported")`. If the event never comes, Next appears after a timeout, so nobody gets stuck.

## Plugins and events

Every start, step, completion, skip and stop goes to `onEvent`, so wiring a tour to your analytics takes a few lines. For more, there's a small, versioned plugin API. A plugin is a plain object that can:

- add path styles;
- supply tours as data, from a CMS or a file. Each one is validated against your targets first;
- decide whether a tour may start, for audiences or frequency caps;
- drive tours at runtime.

A plugin that throws never breaks a tour. Plugins can add behaviour, but they can't change how targets are found or how steps end.

## Where it runs

The same tour runs on the web and on React Native, and `import … from "hintbeam"` picks the right build. Router adapters let tours follow users between pages. There are adapters for the Next.js App Router, React Router and Remix, Expo Router and React Navigation, and `useRouterAdapter` covers anything else. `hintbeam/core` is the engine without React, with zero runtime dependencies, for validating tours on a server or in CI.

**React Native support is a preview.** It type-checks and shares the web build's core, but it hasn't been run on real iOS and Android devices yet. We want that done before 1.0. If you try it on a device, please tell us how it goes.

## Where it is going

Hintbeam is MIT, and the library will stay free. That covers every platform, router, path style and the plugin API. The library never checks a licence key and never phones home.

Later we plan to offer things that need a server: a hosted editor for writing tours without a deploy, live preview, analytics dashboards, audience targeting and progress synced across devices. These would come as a separate Pro package, plugged in through the same public plugin API. Nothing in the open-source library will be held back for them. None of it exists yet.

Known gaps before 1.0: screens match exactly, so there are no `/projects/:id` patterns yet; targets inside virtualised lists aren't handled; and React Native needs its device pass.

## Try it

```sh
npm install hintbeam
```

Then read [Getting started](https://github.com/CypherRatHQ/hintbeam/blob/main/docs/getting-started.md), or follow one of the tutorials:

- [Add a product tour to a Next.js App Router app](/blog/nextjs-app-router-product-tour)
- [An onboarding tour for React Native with Expo Router or React Navigation](/blog/react-native-onboarding-tour) (preview)

The code is at [github.com/CypherRatHQ/hintbeam](https://github.com/CypherRatHQ/hintbeam). Issues and pull requests are welcome, and accessibility problems are treated as bugs.
