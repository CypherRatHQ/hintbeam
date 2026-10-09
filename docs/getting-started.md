# Getting started

Five minutes from install to your first tour. Pick your platform; the steps are the same everywhere.

## Using an AI coding agent?

Paste this into Claude Code, Cursor, Copilot or any coding agent. It reads the full documentation
and does the steps on this page for you.

```text
Add a product tour to this app with Hintbeam (https://hintbeam.js.org). First download https://hintbeam.js.org/llms-full.txt and read all of it (for example with curl; a summarised fetch leaves out details you need). It is the complete documentation. Then:
1. Detect the framework (Next.js App Router, React Router, Expo Router, React Navigation or plain React) and install `hintbeam`.
2. Follow "Getting started" for that framework: list the targets with `defineTargets` in `tours.ts`, add the `declare module "hintbeam"` Register block, and wrap the app in `TourProvider` with the matching router adapter and storage (`browserTourStorage()` on the web, `createTourStorage(AsyncStorage)` on React Native).
3. Ask me which flow to guide, or propose a 3–5 step first-run tour of the main screens.
4. Attach `useTarget("name")` to those elements. Never use CSS selectors. In the Next.js App Router, keep pages as Server Components and put the tagged elements in small "use client" components; import `tours.ts` only from client files.
5. Write the tour with `defineTour`, and start it with `useTour().startOnce(tour)` from a client component rendered inside `TourProvider`.
6. Run the type check, the build and the tests (say so if the project has none), then show me the diff.
```

## 1. Install

```sh
npm install hintbeam
```

React Native / Expo also needs `react-native-svg` (Expo: `npx expo install react-native-svg`).

`import { … } from "hintbeam"` gives you the web build in browsers and the native build in React
Native automatically. You never import a platform by hand.

## 2. Say what can be pointed at

Make one file, `tours.ts`, and list the things a tour may point at. These are **targets**.
(In Next.js, put it in `app/`: `app/tours.ts`.)

```ts
import { defineTargets, defineTour } from "hintbeam";

export const targets = defineTargets({
  search:   { screen: "/food",     about: "The food search box" },
  logMeal:  { screen: "/food",     about: "The button that logs a meal" },
  weight:   { screen: "/progress", about: "This week's weight chart" },
  helpIcon: {                      about: "The ? in the header, on every page" },
});

// Lets TypeScript check every useTarget("…") name against this list.
declare module "hintbeam" {
  interface Register {
    targets: typeof targets;
  }
}
```

- `screen` is the page the target lives on, written the way your router writes it (`"/food"` in
  Next.js, React Router and Expo Router; `"Food"` in React Navigation).
- Leave `screen` out for things shown on every page — a header icon, a tab bar.
- `about` is a note for whoever writes tours. Users never see it.

## 3. Write a tour

```ts
export const firstMeal = defineTour(targets, {
  id: "first-meal",
  steps: [
    { target: "search",  title: "Find food", text: "Search anything you ate." },
    { target: "logMeal", text: "Log it with one tap.", advanceOn: "tap" },
    { target: "weight",  text: "Your progress lives here." },
  ],
});
```

A misspelt target is a **compile error**, in tours and in `useTarget`, and a "did you mean…?" error
at runtime.

## 4. Wrap your app once

### React (Vite, CRA) with React Router

```tsx
import { TourProvider } from "hintbeam";
import { useReactRouter } from "hintbeam/react-router";
import { targets } from "./tours";

function Tours({ children }) {
  return <TourProvider targets={targets} router={useReactRouter()}>{children}</TourProvider>;
}

// Inside your <BrowserRouter> / <RouterProvider> tree:
<Tours><App /></Tours>
```

### Next.js (App Router)

```tsx
// app/tour-provider.tsx
"use client";
import { TourProvider, browserTourStorage } from "hintbeam";
import { useNextRouter } from "hintbeam/next";
import { targets } from "./tours";

// Remembers who finished or skipped a tour. Safe during server rendering.
const storage = browserTourStorage();

export function Tours({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider targets={targets} router={useNextRouter()} storage={storage}>
      {children}
    </TourProvider>
  );
}

// app/layout.tsx (stays a Server Component)
<body><Tours>{children}</Tours></body>
```

**Server Components.** Hintbeam runs in the browser: `TourProvider`, `useTarget`, `useScreenLink`
and `useTour` work in files marked `"use client"`. Keep your pages as Server Components and move just
the elements a tour points at into small client components (step 5). Import `tours.ts` only from
client files. To check tours on a server instead, import `defineTargets`, `defineTour` and
`parseTour` from `hintbeam/core`, which has no React.

### Expo Router

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { TourProvider } from "hintbeam";
import { useExpoRouter } from "hintbeam/expo-router";
import { targets } from "../tours";

export default function Root() {
  return (
    <TourProvider targets={targets} router={useExpoRouter()}>
      <Stack />
    </TourProvider>
  );
}
```

### React Navigation

```tsx
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { TourProvider } from "hintbeam";
import { useReactNavigation } from "hintbeam/react-navigation";

const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
    <TourProvider targets={targets} router={useReactNavigation(navigationRef)}>
      <NavigationContainer ref={navigationRef}>
        <RootStack /> {/* your navigator */}
      </NavigationContainer>
    </TourProvider>
  );
}
```

No router? Leave `router` out — everything is treated as one screen.

## 5. Tag the elements

Attach a ref to something you already render. Nothing is wrapped, nothing moves.

```tsx
import { useTarget } from "hintbeam";

function FoodPage() {
  const search = useTarget("search");
  const logMeal = useTarget("logMeal");
  return (
    <>
      <input ref={search} placeholder="Search" />          {/* web */}
      <button ref={logMeal}>Log meal</button>
    </>
  );
}
// React Native: <TextInput ref={search} />, <Pressable ref={logMeal} />
```

In the Next.js App Router, make that a small client component and use it in your page:

```tsx
// app/food/search-box.tsx
"use client";
import { useTarget } from "hintbeam";

export function SearchBox() {
  return <input ref={useTarget("search")} placeholder="Search" />;
}
```

A link, tab or menu item that leads to another page can be tagged too, so a step whose target is
there can point at the way in: `<Link ref={useScreenLink("/food")} href="/food">Food</Link>`.

## 6. Start it

```tsx
"use client";
import { useTour } from "hintbeam";
import { firstMeal } from "./tours";

export function HelpMenu() {
  const { start } = useTour();
  return <button onClick={() => start(firstMeal)}>Show me around</button>;
}
```

That's a working tour. When a step's target is on another page, the card offers **Take me there**.
When the target is scrolled out of view, it offers **Show me**. When it can't be found, the card says
so and lets people carry on, rather than pointing at empty space.

To show it on someone's first visit, call `startOnce`. It plays the tour only if they have never
finished or skipped it, and it waits for saved progress before deciding, so it's right on page load
with any `storage`. Call it from a component rendered inside `TourProvider` (in Next.js, a client
component), on the page where the tour begins:

```tsx
"use client";
import { useEffect } from "react";
import { useTour } from "hintbeam";
import { firstMeal } from "./tours";

export function FirstVisitTour() {
  const { startOnce } = useTour();
  useEffect(() => {
    void startOnce(firstMeal);
  }, [startOnce]);
  return null;
}
```

Pass `storage` to `TourProvider` (see [Concepts](concepts.md)) so this survives a reload.

## 7. Make it look like your product

```tsx
import { TourProvider, createTourTheme } from "hintbeam";

const theme = createTourTheme({ brand: "#E5484D", mode: "light", style: "balanced" });

<TourProvider targets={targets} router={…} theme={theme}>
```

`style` is one of `"aurora"`, `"balanced"`, `"subtle"` or `"minimal"`, from most to least going on.
[Customising](customising.md) covers every option.

## Testing your app

Hintbeam is published as ES modules. Vitest, Vite, Next.js and Metro read them as they are, so
there is nothing to set up. Jest transforms only your own code by default, so tell it to transform
`hintbeam` too:

```js
// jest.config.js
module.exports = {
  // …your config
  transformIgnorePatterns: ["/node_modules/(?!hintbeam/)"],
};
```

With a preset that already sets this list (`jest-expo`, `react-native`), add `hintbeam` to the
names inside its `(?!…)` group instead of replacing it.

## Next

- [Concepts](concepts.md) — how targets, steps and screens fit together
- [Customising](customising.md) — brand colours and styles, words and translations, line styles, your own card
- [Routers](routers.md) — every router, and how to plug in your own
- [Plugins](plugins.md) — analytics, targeting and add-ons
- [API reference](api.md)
