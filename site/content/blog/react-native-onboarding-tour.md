---
title: "An onboarding tour for React Native with Expo Router or React Navigation (preview)"
description: "Add an onboarding tour to a React Native or Expo app with hintbeam and Expo Router or React Navigation. Preview: not yet tested on real devices."
date: "2026-10-08"
author: "Hintbeam team"
tags: ["react-native", "expo", "expo-router", "react-navigation", "tutorial", "onboarding"]
---

> **React Native support is a preview.** Hintbeam's native build type-checks against React Native, Expo Router and React Navigation, and it shares its core with the web build. That core is unit-tested. But it **has not yet been run on a real iOS or Android device**, and neither has the code in this tutorial. Please try it, and [tell us what breaks](https://github.com/CypherRatHQ/hintbeam/issues). A device pass is one of the things we want done before 1.0.

This tutorial adds a welcome tour to an Expo app that uses Expo Router, with tabs for Food and Progress. A section at the end covers React Navigation. The tour:

- points at a search field and a button on the Food tab;
- waits for the user to tap the real button;
- moves to the Progress tab with **Take me there**;
- plays by itself until the user has finished it once;
- can be replayed from a help button.

## 1. Install

```sh
npm install hintbeam
npx expo install react-native-svg @react-native-async-storage/async-storage
```

`react-native-svg` draws the light. AsyncStorage is optional; we use it to remember progress between launches. `import … from "hintbeam"` picks the native build automatically in React Native, so you never import a platform by hand.

## 2. Declare targets and write the tour

A **target** is a name for something a tour can point at, with the screen it lives on. With Expo Router, a screen is a pathname. `app/(tabs)/food.tsx` is `"/food"`, because groups in parentheses aren't part of the path.

```ts
// tours.ts
import { defineTargets, defineTour } from "hintbeam";

export const targets = defineTargets({
  search:   { screen: "/food",     about: "The food search field" },
  logMeal:  { screen: "/food",     about: "The Log meal button" },
  weight:   { screen: "/progress", about: "This week's weight chart" },
  helpIcon: {                      about: "The ? in the header, on every screen" },
});

export const welcome = defineTour(targets, {
  id: "welcome",
  steps: [
    { target: "search", title: "Find food", text: "Search anything you ate today." },
    { target: "logMeal", text: "Log it with one tap. Try it now.", advanceOn: "tap" },
    { target: "weight", title: "Your progress", text: "Your week at a glance lives here." },
    { target: "helpIcon", text: "Replay this tour any time from here." },
  ],
});

declare module "hintbeam" {
  interface Register {
    targets: typeof targets;
  }
}
```

`helpIcon` has no `screen`, so it counts as drawn on every screen. The `declare module` block gives `useTarget` autocomplete, and turns a misspelt target into a compile error.

## 3. Wrap the app in the root layout

Put `TourProvider` in `app/_layout.tsx`, where Expo Router's hooks work:

```tsx
// app/_layout.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { TourProvider, createTourTheme, createTourStorage } from "hintbeam";
import { useExpoRouter } from "hintbeam/expo-router";
import { targets } from "../tours";

const storage = createTourStorage(AsyncStorage);
const theme = createTourTheme({ brand: "#FF7A45", mode: "dark", style: "balanced" });

export default function RootLayout() {
  return (
    <TourProvider targets={targets} router={useExpoRouter()} storage={storage} theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </TourProvider>
  );
}
```

- **`useExpoRouter()`** tells the tour which screen is in front, and navigates for **Take me there**.
- **`createTourStorage(AsyncStorage)`** remembers each tour's progress. It never throws: if storage fails, progress just isn't kept.
- **`createTourTheme`** makes the light, the highlight and the main button from your brand colour. `style` can be `"aurora"`, `"balanced"`, `"subtle"` or `"minimal"`, from most going on to least.

## 4. Tag the elements

`useTarget(name)` returns a ref. Attach it to a component you already render. Nothing is wrapped, and the layout doesn't change.

For the Food tab, also spread `useTourScroll` onto the screen's `ScrollView`. Then, when a target is scrolled out of view, the card can offer **Show me** and scroll it back:

```tsx
// app/(tabs)/food.tsx
import { useEffect } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { useTarget, useTour, useTourScroll } from "hintbeam";
import { welcome } from "../../tours";

export default function FoodScreen() {
  const search = useTarget("search", { radius: 12 });
  const logMeal = useTarget("logMeal", { radius: 12 });
  const scroll = useTourScroll("/food");
  const { startOnce } = useTour();

  // The first time only: does nothing once the user has finished or skipped it.
  useEffect(() => {
    void startOnce(welcome);
  }, [startOnce]);

  return (
    <ScrollView {...scroll}>
      <TextInput ref={search} placeholder="Search food" />
      {/* … a long list of meals … */}
      <Pressable ref={logMeal} onPress={() => { /* open your log-meal sheet */ }}>
        <Text>Log meal</Text>
      </Pressable>
    </ScrollView>
  );
}
```

If you already handle `onScroll` on that `ScrollView`, call the `onScroll` from `useTourScroll` inside your own handler.

On the Progress tab:

```tsx
// app/(tabs)/progress.tsx
import { View } from "react-native";
import { useTarget } from "hintbeam";

export default function ProgressScreen() {
  const weight = useTarget("weight", { radius: 16 });
  return <View ref={weight} collapsable={false} style={{ height: 220 }} />;
}
```

Hintbeam measures elements with `measureInWindow`. On Android, React Native can flatten away a plain `View` that only does layout, and then there's nothing to measure. `collapsable={false}` keeps it.

## 5. First launch, and a replay button

Look at the `useEffect` in the Food screen: it calls `startOnce(welcome)`. That plays the tour only if this user has never finished or skipped it, so it is safe to call on every visit.

`startOnce` waits for saved progress to load before it decides. That matters with AsyncStorage, which reads asynchronously: on a cold start, the app renders before progress is back from storage. If you check `hasCompleted(tour)` yourself on the first render, it can answer "not finished" for a tour that was, and the tour plays again. `startOnce` avoids that. It resolves to `"seen"` when it does nothing, if you want to log it.

To replay the tour on request, `start` always plays from the first step. Put a help button in the tab header, so it's on every screen:

```tsx
// help-button.tsx
import { Pressable, Text } from "react-native";
import { useTarget, useTour } from "hintbeam";
import { welcome } from "./tours";

export function HelpButton() {
  const help = useTarget("helpIcon", { radius: 999 });
  const { start } = useTour();
  return (
    <Pressable ref={help} accessibilityLabel="Show me around" onPress={() => start(welcome)}>
      <Text>?</Text>
    </Pressable>
  );
}
```

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { HelpButton } from "../../help-button";

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerRight: () => <HelpButton /> }} />;
}
```

## 6. Going between tabs

Step 3 points at the weight chart on `/progress`. When the user reaches it from the Food tab, the card offers **Take me there**, which navigates through Expo Router. Then the step measures again on the new screen.

If you render your own link to a screen, mark it with `useScreenLink`. The tour then points at the link first, so people learn the way:

```tsx
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { useScreenLink } from "hintbeam";

export function ProgressCard() {
  const link = useScreenLink("/progress", { radius: 16 });
  const router = useRouter();
  return (
    <Pressable ref={link} onPress={() => router.navigate("/progress")}>
      <Text>See your progress</Text>
    </Pressable>
  );
}
```

The navigator draws the tab bar's own buttons, and we don't have a documented way to mark those yet. Without a marked link, **Take me there** still works. There's just nothing to highlight on the way.

## Using React Navigation instead

With React Navigation, screens are **route names**, such as `"Food"`, not paths. `useReactNavigation` takes the same ref you give `NavigationContainer`, so the provider can sit outside it:

```tsx
// App.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { TourProvider, defineTargets, createTourStorage } from "hintbeam";
import { useReactNavigation } from "hintbeam/react-navigation";
import { RootStack } from "./RootStack";

const navigationRef = createNavigationContainerRef();
const storage = createTourStorage(AsyncStorage);

// With React Navigation, screens are route names.
export const targets = defineTargets({
  search: { screen: "Food" },
  weight: { screen: "Progress" },
  helpIcon: {},
});

export default function App() {
  return (
    <TourProvider targets={targets} router={useReactNavigation(navigationRef)} storage={storage}>
      <NavigationContainer ref={navigationRef}>
        <RootStack />
      </NavigationContainer>
    </TourProvider>
  );
}
```

`RootStack` is your existing navigator. Everything else in this tutorial is the same, with route names in place of paths: `useTourScroll("Food")`, `useScreenLink("Progress")`. React Navigation 6 and 7 are supported.

## What the user sees

- **Visible:** the light runs from the card's guide to the element, and a ring outlines it.
- **Scrolled away:** the light runs to the screen edge the element is past, and the card offers **Show me**.
- **On another tab:** **Take me there**.
- **Not found:** the card says "I can't find this here right now." and offers Next. It never points at nothing.

Every step is announced once to screen readers through `AccessibilityInfo.announceForAccessibility`. With the system's reduce-motion setting on, the light is drawn without animation. The buttons are at least 44 × 44 points. We haven't checked any of this with VoiceOver or TalkBack on a device yet. That's part of the device pass.

## Help us finish the preview

If you try this on a device, an issue with your React Native and Expo versions and what you saw would help a lot, whether it worked or not. The code is at [github.com/CypherRatHQ/hintbeam](https://github.com/CypherRatHQ/hintbeam).
