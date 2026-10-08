# Concepts

Four words carry the whole library: **target**, **tour**, **step**, **screen**.

## Targets

A target is a *name* for something a tour can point at, declared once with `defineTargets`. The
element is attached later, wherever it is rendered, with `useTarget(name)`. An element that renders
late (after data loads, behind a toggle) is picked up the moment it mounts, even while its step is
already showing.

Keeping names separate from elements is what makes the rest possible:

- **Tours are data.** A step says `target: "search"`, not "the third button in the header". Tours
  survive redesigns, and can be stored as JSON, edited in a CMS, or drafted by an AI.
- **Typos are caught.** In TypeScript a wrong name does not compile; in JSON it fails validation with
  a "did you mean…?" hint.
- **One name, many elements.** A phone tab bar and a desktop sidebar can both carry `"reports"`.
  Whichever is actually on screen is used, so one tour works at every size.
- **One element, many names.** `useTarget(["search", "firstField"])`.

## Tours and steps

A tour is `{ id, steps }`, with 1–8 steps. Each step has a `target`, `text`, an optional `title`, and
an optional `advanceOn` — how it ends:

| `advanceOn` | The step ends when… |
| --- | --- |
| `"next"` *(default)* | the user taps Next |
| `"tap"` | the user taps the highlighted element itself |
| `"arrive"` | the user reaches the screen the target is on |
| `{ event: "report.exported", timeout: 30 }` | your app calls `emit("report.exported")`. After `timeout` seconds (default 30) Next appears anyway, so nobody gets stuck |

Text is plain words on one line (60 characters for a title, 160 for text). That keeps steps short —
users skip long tours — and makes JSON from anywhere safe to show.

## Screens

A screen is a page, named the way your router names it. Each target says which screen it lives on.
The router adapter tells the tour which screen is in front and how to get to another one.

## Finding the target — never pointing at nothing

Every time a step shows, and every time something moves (a navigation, a scroll settling, a resize),
the tour **measures** where its target is. It never remembers a position. There are four outcomes:

| Where | What the user sees |
| --- | --- |
| **visible** — on this screen, in view | The light and ring point at it |
| **offscreen** — on this screen, scrolled away | A **Show me** button scrolls it into view |
| **otherScreen** — on a different screen | The link to that screen is highlighted, with **Take me there** |
| **notFound** — not on screen anywhere | The card says so and offers Next. It never points at nothing |

The page itself is the scroll area on the web. For content that scrolls inside its own container (and
for React Native's `ScrollView`), use `useTourScroll(screen)` so "Show me" can scroll it.

## The tour is a companion, not a modal

The card never covers or blocks your app. Users can keep using the real screen — tapping the
highlighted button *is* the step, in a `"tap"` step. Skip closes the tour and remembers the step, so
`resume(tour)` continues later; `stop()` closes without remembering.

## Progress

The provider remembers, per tour, the step a user reached, whether they skipped, when they first
finished, and how many times they played it. Pass `storage` to keep it across reloads:

```ts
// Web: localStorage, safe in server rendering (Next.js). Create it once, outside render.
import { browserTourStorage } from "hintbeam";
const storage = browserTourStorage();

// React Native, or any store with getItem and setItem (MMKV, your own API)
import { createTourStorage } from "hintbeam";
const storage = createTourStorage(AsyncStorage);

<TourProvider storage={storage} … />
```

Saved progress loads asynchronously. `startOnce(tour)` waits for it before deciding, so use it for
a first-visit tour rather than checking `hasCompleted` on the first render.

`mergeTourProgress(a, b)` joins two copies (two devices) safely — it is commutative, associative and
idempotent — for when you sync progress through your own backend.

## Layers

```
hintbeam/core           the engine: tours, validation, finding, the player, progress, paths, plugins
        │                   (no React — use it on a server, in a CMS, in CI)
hintbeam (React)        TourProvider, useTarget, useTour, useTourStep
   ├── web                  React DOM, Next.js, Vite, Expo web
   └── native               React Native, Expo
routers                     next · react-router · expo-router · react-navigation · your own
plugins                     analytics · targeting · path styles · add-ons
```

See [Architecture](architecture.md) for how to add a platform, a router or a renderer.
