---
title: "Why product tours break, and how Hintbeam handles it"
description: "Tour steps point at empty space when elements scroll away, render late or live on another page. How Hintbeam measures and handles each case."
date: "2026-10-08"
author: "CypherRat"
tags: ["product-tours", "onboarding", "react", "react-native", "guides"]
---

If you have shipped a product tour, you may have seen this bug report: *"The tour pointed at nothing."* There's a card and an arrow, and the button it describes is somewhere else, or nowhere at all.

It's rarely one bug. A tour runs on top of an app that keeps changing underneath it. This post walks through how that happens, and how Hintbeam, an MIT-licensed library for product tours and guided flows in React, Next.js and React Native, handles each case.

## The one rule: measure, never remember

The simplest way to build a tour is to read the element's position when the step starts and draw the card there. That works in a demo. In a real app the position is a snapshot, and the app keeps moving.

Hintbeam never stores a position. It holds *refs* to elements, not coordinates. Every time a step shows, and after a navigation, a scroll settling or a resize, it asks again where the element is. There are always four possible answers:

| Answer | What it means | What the user sees |
| --- | --- | --- |
| `visible` | On this screen, in view | The light and the ring point at it |
| `offscreen` | On this screen, scrolled away | **Show me** scrolls it into view |
| `otherScreen` | Declared on a different screen | The link to that screen is highlighted, with **Take me there** |
| `notFound` | Not on screen anywhere | The card says so and offers Next |

## Case 1: it's right there

The element is on this screen and in view. The card sits beside it: below if there's room, then above, right or left. On narrow phones it docks to the screen edge away from the element. A line of light runs from the card to the element, and a ring outlines it.

Then the page scrolls, or a sidebar opens. On the web, the card, the light and the ring follow the element every frame while anything scrolls. When the scroll settles, the step measures again from scratch. If the element has gone out of view, the step moves into case 2 by itself.

Responsive layouts are a related problem: the phone layout has a tab bar, the desktop layout has a sidebar, and the "Reports" link exists twice. Both elements can carry the same target name:

```tsx
const reportsTab = useTarget("reports");     // in the phone tab bar
const reportsItem = useTarget("reports");    // in the desktop sidebar
```

Whichever one is actually laid out is used. You write one tour, and it works at every size.

## Case 2: it's further down

The element is on this screen, but below the fold or inside a scrolled panel. Its coordinates are off the edge of the screen.

The step knows which way the element is: up or down. The light runs to that edge of the screen and ends in a soft glow with a chevron. The card docks toward it, and its main button becomes **Show me**, which scrolls the element into view.

On the web, the page itself is the scroll area, so this needs no setup. If content scrolls inside its own container, tell Hintbeam which element scrolls:

```tsx
<div ref={useTourScroll("/settings")} style={{ overflow: "auto" }}>…</div>
```

On React Native, spread `useTourScroll` onto the screen's `ScrollView`:

```tsx
<ScrollView {...useTourScroll("/food")}>…</ScrollView>
```

## Case 3: it's on another page

Step 3 is about the Invite button, which is on the Team page. The user is on the Dashboard.

Each target says which screen it lives on, named the way your router names it:

```ts
const targets = defineTargets({
  revenue: { screen: "/dashboard" },
  invite:  { screen: "/settings/team" },
  help:    {},                              // on every screen
});
```

A router adapter tells the tour which screen is in front, and how to go to another. There are adapters for the Next.js App Router, React Router and Remix, Expo Router and React Navigation; `useRouterAdapter` covers anything else.

When the target is on another screen, the card offers **Take me there**. If you've marked the link to that screen, the tour points at it, so the user learns the way:

```tsx
const teamLink = useScreenLink("/settings/team");
<a ref={teamLink} href="/settings/team">Team</a>
```

Pressing **Take me there** navigates and measures again. If the target is further down the new page, it scrolls it into view too, so one press is enough. If you'd rather the user went there themselves, `advanceOn: "arrive"` ends the step when they reach the target's screen.

One limit to know about: screens match exactly. A target on `/projects/42` needs that exact path, or a tour built at runtime for that project. Pattern matching (`/projects/:id`) is planned but not there yet.

## Case 4: it's not on screen

Sometimes the element isn't there at all:

- a feature flag is off for this user;
- the element is hidden at this screen size;
- the list it lives in is empty;
- someone renamed a component and forgot to move the `useTarget`.

An element that isn't laid out measures as nothing, and so does a measurement that takes longer than a second. The step lands on `notFound`. The card says so in plain words ("I can't find this here right now.", which you can reword) and offers Next. It doesn't guess, and it doesn't draw a ring around empty space.

In development you also get a console warning naming the target and the screen, so the renamed-component case shows up while you're working.

## What about elements that render late?

Say the element appears only after a fetch finishes. When a step shows and its element isn't there yet, the card says it can't find it, and lets people carry on. The moment the element mounts, `useTarget` tells the open step, which looks again and points at it. No scroll or timer needed.

A step also looks again after a navigation, a scroll settling, a resize, or a **Take me there**.

If the user should wait for the data before moving on, make the previous step wait for your app. End it on an event, and emit the event once the data is in:

```ts
{ target: "reportsTab", text: "Open your reports.", advanceOn: { event: "reports.loaded" } }
```

```tsx
const { emit } = useTour();
useEffect(() => {
  if (reports) emit("reports.loaded");
}, [reports, emit]);
```

If the event never comes, Next appears after the timeout (30 seconds by default), so nobody gets stuck.

For a layout change Hintbeam can't see, such as an element moved by your own animation, `useTourStep()` returns `refresh()`, which finds the target again.

## Tours that can't point at the wrong name

All of this depends on the tour naming the right target. Targets are declared once, so in TypeScript a misspelt name doesn't compile. Tours loaded as JSON go through `parseTour`, which returns problems such as `"serch" is not a declared target. Did you mean "search"?` instead of throwing.

## A companion, not a modal

The card never covers or blocks your app. The screen may dim slightly around the element (you can turn that off), but all of it stays usable. So a step can be "tap the real button" (`advanceOn: "tap"`), and a user who wanders off mid-tour isn't trapped. Skip remembers where they were, and `resume` picks up from there later.

## Try it

```sh
npm install hintbeam
```

[Getting started](https://github.com/CypherRatHQ/hintbeam/blob/main/docs/getting-started.md) takes about five minutes. The [Concepts](https://github.com/CypherRatHQ/hintbeam/blob/main/docs/concepts.md) page has the full details of how targets are found. If you find a layout where a step points at the wrong thing, please [open an issue](https://github.com/CypherRatHQ/hintbeam/issues). That's exactly the kind of bug we want to hear about.
