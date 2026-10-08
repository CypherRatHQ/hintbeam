# Getting started

Five minutes from install to your first tour. Pick your platform; the steps are the same everywhere.

## 1. Install

```sh
npm install hintbeam
```

React Native / Expo also needs `react-native-svg` (Expo: `npx expo install react-native-svg`).

`import { … } from "hintbeam"` gives you the web build in browsers and the native build in React
Native automatically. You never import a platform by hand.

## 2. Say what can be pointed at

Make one file, `tours.ts`, and list the things a tour may point at. These are **targets**.

```ts
import { defineTargets, defineTour } from "hintbeam";

export const targets = defineTargets({
  search:   { screen: "/food",     about: "The food search box" },
  logMeal:  { screen: "/food",     about: "The button that logs a meal" },
  weight:   { screen: "/progress", about: "This week's weight chart" },
  helpIcon: {                      about: "The ? in the header, on every page" },
});
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

A misspelt target is a **compile error**, and a "did you mean…?" error at runtime.

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
// app/tours.tsx
"use client";
import { TourProvider } from "hintbeam";
import { useNextRouter } from "hintbeam/next";
import { targets } from "./tour-data";

export function Tours({ children }: { children: React.ReactNode }) {
  return <TourProvider targets={targets} router={useNextRouter()}>{children}</TourProvider>;
}

// app/layout.tsx
<body><Tours>{children}</Tours></body>
```

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

## 6. Start it

```tsx
import { useTour } from "hintbeam";
import { firstMeal } from "./tours";

function HelpMenu() {
  const { start } = useTour();
  return <button onClick={() => start(firstMeal)}>Show me around</button>;
}
```

That's a working tour. When a step's target is on another page, the card offers **Take me there**.
When the target is scrolled out of view, it offers **Show me**. When it can't be found, the card says
so and lets people carry on, rather than pointing at empty space.

To show it on someone's first visit, call `startOnce`. It plays the tour only if they have never
finished or skipped it, and it waits for saved progress before deciding, so it's right on page load
with any `storage`:

```tsx
const { startOnce } = useTour();
useEffect(() => {
  void startOnce(firstMeal);
}, [startOnce]);
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
