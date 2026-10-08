# API reference

Everything is imported from `"hintbeam"` unless noted. It picks the web or React Native build for
you.

## Naming

Hintbeam lives next to your UI kit, your router and your own code, so its names never clash with
theirs:

- **Every export is a hook (`use…`) or says "tour":** `TourProvider`, `createTourTheme`,
  `TourStep`, `TOUR_STYLES`. You can import `createTheme` from MUI or Mantine in the same file.
- **The few exceptions are already specific:** `defineTargets`, `TargetName`, `GuideOrb`,
  `createManualRouter`.
- **Groups of built-ins share one shape:** `TOUR_STYLES`, `TOUR_THEMES`, `TOUR_PATHS`,
  `TOUR_LABELS`, `TOUR_LIMITS`.
- **`"hintbeam"` is the app API.** The engine underneath it (player, registry, geometry, path
  maths) is in [`hintbeam/core`](#hintbeamcore), for building renderers, light styles and plugins.

A check in CI keeps it this way: a new export with a generic name fails the build.

## Defining

### `defineTargets(definitions, options?)`

```ts
const targets = defineTargets(
  { search: { screen: "/food", about: "The search box" }, helpIcon: {} },
  { events: ["meal.logged"] },
);
```

- `definitions[name].screen?: string | null` — the screen it lives on; omit for every screen.
- `definitions[name].about?: string` — a note for tour authors.
- `options.events?: string[]` — event names steps may wait for (catches typos).

Returns `TourTargets` with `names`, `events`, `has(name)`, `screenOf(name)`, `about(name)`.

### `defineTour(targets, tour)`

Typed to your targets; validates immediately and throws a readable error if anything is wrong.

### `parseTour(json, targets)` → `{ ok: true, tour } | { ok: false, problems }`

For tours you load. Never throws. `problems` are `{ path, message }`, e.g.
`{ path: "steps[1].target", message: '"serach" is not a declared target. Did you mean "search"?' }`.

### `validateTour(input, targets)` → `TourProblem[]` · `formatTourProblems(id, problems)` → `string`

### Types

```ts
interface Tour { id: string; steps: TourStep[]; meta?: TourMeta }
interface TourStep { target: string; title?: string; text: string; advanceOn?: AdvanceOn; meta?: Record<string, unknown> }
type AdvanceOn = "next" | "tap" | "arrive" | { event: string; timeout?: number };
```

Limits (`TOUR_LIMITS`): 1–8 steps; title 2–60 characters; text 4–160; timeout 5–300 seconds, default 30.

## `<TourProvider>`

| Prop | Type | |
| --- | --- | --- |
| `targets` | `TourTargets` | **Required.** From `defineTargets` |
| `router` | `TourRouter` | From a router adapter. Default: one screen |
| `storage` | `TourStorage` | Where progress is kept: `browserTourStorage()` (web), `createTourStorage(AsyncStorage)` (native). Default: in memory |
| `labels` | `Partial<TourLabels>` | Every word users read |
| `theme` | `TourThemeInput` | From `createTourTheme(…)`, or any `TourTheme` values. Default: `TOUR_THEMES.light` |
| `path` | `"wave" \| "strands" \| "straight" \| "elbow" \| "arc" \| string` | Path style. Default `"wave"` |
| `tours` | `Tour[]` | Tours startable by id: `start("first-meal")` |
| `user` | `{ id?, traits? }` | Who is using the app — handed to plugins, never sent anywhere |
| `plugins` | `TourPlugin[]` | Add-ons |
| `onEvent` | `(event: TourEvent) => void` | Every start, step, complete, skip, stop |
| `renderStep` | `(step: TourStepView) => ReactNode \| null` | Your own card; `null` for headless |

## Hooks

### `useTarget(name | names, { radius? })` → `ref`

Attach to the element. `radius` makes the highlight ring follow rounded corners. Typed to your targets
once you [register them](#typing-useTarget).

### `useScreenLink(screen, { radius? })` → `ref`

Attach to the link, tab or menu item that leads to `screen`.

### `useTourScroll(screen)`

- **Web:** returns a `ref` for an element that scrolls its own content. Not needed for the page itself.
- **React Native:** returns props to spread onto the screen's `ScrollView`: `<ScrollView {...useTourScroll("/food")}>`.

### `useTour()`

| | |
| --- | --- |
| `start(tour \| id)` | Play from the first step. Resolves to a `TourStartResult`: `"started"`, `"already-playing"`, `"blocked"` (by a plugin) or `"unknown-tour"` |
| `resume(tour)` | Play from where the user skipped, or from the start. Also `"resumed"` |
| `startOnce(tour)` | Play only if this user has never finished or skipped it; waits for saved progress first. Also `"seen"` |
| `next()`, `back()` | |
| `skip()` | Close and remember the step for `resume` |
| `stop()` | Close without remembering |
| `emit(event)` | Ends a step waiting for that event |
| `isActive`, `tour`, `step`, `index`, `total`, `isFirst`, `isLast`, `waitedTooLong` | Current state |
| `hasCompleted(tour)`, `canResume(tour)` | |

### `useTours()` → `Tour[]`

Every tour that can be started by id: those passed to `TourProvider tours` and those provided by
plugins. Useful for a help menu.

### `useTourStep()` → `TourStepView`

Everything the built-in card uses: the state above plus `where` (`visible` / `offscreen` /
`otherScreen` / `notFound`), `highlight` (`{ box, radius }`), `primary` (`"next"`, `"done"`,
`"showMe"`, `"takeMeThere"`, `"wait"`), `labels`, and `next`, `back`, `skip`, `showMe`,
`takeMeThere`, `refresh`, and for custom UIs that follow the page: `track()` (measure the highlighted
element this instant, without finding it again) and `key` (changes with each step, for keying animations).

## Routers

`useNextRouter()` (`hintbeam/next`) · `useReactRouter()` (`hintbeam/react-router`) ·
`useExpoRouter()` (`hintbeam/expo-router`) · `useReactNavigation(ref)` (`hintbeam/react-navigation`) ·
`useRouterAdapter(screen, navigate)` for your own router · `createManualRouter(initial)` for tests and
apps that track the screen themselves.

```ts
interface TourRouter {
  currentScreen(): string | null;
  navigate(screen: string): void | Promise<void>;
  subscribe(listener: (screen: string | null) => void): () => void;
}
```

## Storage

```ts
browserTourStorage(key?)        // web: localStorage, safe in server rendering (Next.js)
createTourStorage(store, key?)  // any getItem/setItem store: AsyncStorage, MMKV, your API; never throws
mergeTourProgress(a, b)         // join two devices' copies safely

interface TourStorage { load(): Promise<TourProgressState | null>; save(state: TourProgressState): Promise<void> }
```

Without `storage`, progress is kept in memory until the page or app reloads.

## Light styles

Pick one by name: `path="wave"` on `TourProvider`, or `path` in a theme. `TOUR_PATHS` holds the
built-ins: `wave` (default), `strands`, `straight`, `elbow`, `arc`. Their names are `TourPathName`.

Add your own with `defineTourPath` and give it to a plugin's `paths`. The geometry helpers come from
`hintbeam/core`:

```ts
import { defineTourPath } from "hintbeam";
import { center, routeThrough } from "hintbeam/core";

// A straight line to the middle of the target.
const direct = defineTourPath((from, to, options) => {
  const end = center(to);
  return routeThrough(from, [[from, end, end]], options?.samples);
});
// type TourPath = (from: Point, to: Box, options?: TourPathOptions) => PathRoute
```

## Components

`GuideOrb` — the guide on its own: `{ mood?: "point" | "wait" | "search" | "done"; angle?; size?; accent?; accent2? }`.
On React Native it takes `{ accent, accent2, angle, waiting, searching, reduceMotion, size? }`.

## Plugins

```ts
interface TourPlugin {
  name: string;
  apiVersion?: number;                                            // TOUR_PLUGIN_API_VERSION, currently 1
  paths?: Record<string, TourPath>;
  tours?(context: TourPluginContext): unknown[] | Promise<unknown[]>; // validated before use
  canStart?(check: { tour; completed; user; platform }): boolean | Promise<boolean>;
  onEvent?(event: TourEvent, context: TourPluginContext): void;
  setup?(api: TourPluginApi): void | (() => void);                    // start, stop, getState, addTours, drawnTargets…
}
interface TourPluginContext { user: { id?: string; traits?: Record<string, unknown> } | null; platform: string }
```

## Keyboard (web)

While a step shows: **Esc** skips, **→** next, **←** back. Ignored while typing in a field.

## Typing `useTarget`

Register your targets once for autocomplete everywhere:

```ts
declare module "hintbeam" {
  interface Register {
    targets: typeof targets;
  }
}
```

## `hintbeam/core`

The engine without React. It has everything above that isn't a component, hook, theme or label,
and adds the pieces underneath:

- **Engine:** `TourPlayer`, `ElementRegistry`, `resolveTarget`, `memoryTourStorage` (the default), `noRouter`.
- **Geometry:** `Box`, `Point`, `PathRoute`, `center`, `contains`, `inflate`, `edgeNormal`,
  `meetPoint`, `nearEdge`, `visibilityOf`, `scrollToShow`.
- **Path maths:** `routeThrough(start, segments, samples?)`.
- **Card placement:** `placeStep(viewport, target, cardHeight, options)` returns
  `{ left, top, width, side, edge, guide }`. `edgeBeacon(viewport, target, "up" | "down", band?)`
  returns where the light ends for a target scrolled away.

Use it to validate tours on a server or in CI, or to build a renderer, a light style or a new
platform (see [Architecture](architecture.md)). It has no React import, so it is safe anywhere.
