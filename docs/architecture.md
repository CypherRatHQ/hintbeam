# Architecture

hintbeam is built in layers. Each layer depends only on the ones below it, so a new platform,
router, path style or add-on is an addition — never a fork.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  plugins        analytics · targeting · path styles · add-ons              │
├────────────────────────────────────────────────────────────────────────────┤
│  routers        next · react-router · expo-router · react-navigation · own │
├──────────────────────────────┬─────────────────────────────────────────────┤
│  web platform                │  native platform                            │
│  React DOM, Next.js, Vite,   │  React Native, Expo                         │
│  Expo web                    │                                             │
├──────────────────────────────┴─────────────────────────────────────────────┤
│  react           TourProvider factory · useTarget · useTour · useTourStep  │
├────────────────────────────────────────────────────────────────────────────┤
│  core            tours & validation · targets · finding · player ·         │
│                  progress · path styles · card layout · plugin host        │
│                  (pure TypeScript, no React, no platform)                  │
└────────────────────────────────────────────────────────────────────────────┘
```

## core

Pure TypeScript with injected time, storage and measurement. Every rule — validation, the four-way
"where is the target" decision, how steps end, skip and resume, the progress merge, path geometry,
card placement — is unit-tested here without a screen.

- `ElementRegistry` holds refs, never positions. Measuring happens only when a step asks.
- `resolveTarget` turns a target name into `visible` / `offscreen` / `otherScreen` / `notFound`.
- `TourPlayer` is the state machine: start, next, back, skip, stop, tap, arrive, event, timeout.
- Path styles are pure functions `(from, to) => Route`; every renderer draws any route.

## react

`createTourProvider(platform)` builds a `TourProvider` for a platform. The hooks are shared: they
only ever talk to the core and to the platform interface.

## platforms

A platform implements `TourPlatform`:

```ts
interface TourPlatform {
  name: string;
  measurable(ref): Measurable;                       // where is this element, in viewport coordinates
  defaultScrollArea?(): ScrollArea | null;           // the page, on the web
  TapObserver: Component<{ onTap(point) }>;          // see taps without blocking them
  StepUI: Component<{ view, theme, path }>;          // the built-in card and light
  useLayoutChanges(invalidate): void;                // resize, rotation
  useKeyboard?(actions): void;                       // shortcuts
}
```

`hintbeam` resolves to the right platform automatically through the package's `exports`
conditions (`react-native` → native, everything else → web). To add a platform — Vue, Svelte, a
canvas — implement this interface (or reuse `hintbeam/core` directly with your framework's own
reactivity).

## routers

Each adapter is a few lines over `useRouterAdapter(screen, navigate)`. Router packages are optional
peer dependencies: an app installs only the one it uses.

## plugins

`composePlugins` merges plugins into one host: path styles are added to the registry; events fan out
to every plugin; `canStart` requires every plugin to agree. A failing plugin is reported and ignored —
the open-source behaviour always wins.

## Design rules

1. **Measure, never remember.** Positions are read when needed and re-read when anything moves.
2. **Never point at nothing.** Every outcome of finding a target has an honest UI.
3. **A companion, not a modal.** The app stays usable; tapping the real button is a valid step.
4. **Data first.** Tours are validated data, the same in code and in JSON.
5. **Add, don't fork.** Platforms, routers, paths and plugins plug in; none edits the core.
