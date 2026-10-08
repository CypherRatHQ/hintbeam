---
"hintbeam": minor
---

First public release.

**Naming.** `import … from "hintbeam"` is the app API: about 70 names, each one a hook or naming the
tour domain (`TourProvider`, `createTourTheme`, `TourStep`, `TOUR_STYLES`), so nothing clashes with a
UI kit, a router or your code. The engine (player, registry, geometry, path maths) is in
`hintbeam/core`. CI fails on a new generic name in the main entry.

**Added**

- **Core** (`hintbeam/core`, zero dependencies):
  - Tours and targets: `defineTargets`, `defineTour`, `parseTour`, `validateTour` and
    `formatTourProblems`, with "did you mean…?" hints.
  - Finding targets: `ElementRegistry` (the first drawn element wins) and `resolveTarget`, which
    returns `visible`, `offscreen`, `otherScreen` or `notFound`.
  - Playing tours: `TourPlayer`, with steps that end on `next`, `tap`, `arrive` or an event with a
    timeout. Skip pauses the tour, `resume` continues it, and a double start counts as one.
  - Progress: `mergeTourProgress` (property-tested to be commutative, associative and idempotent), plus
    `memoryTourStorage` and `createTourStorage`.
  - Light styles in `TOUR_PATHS`: `wave`, `strands` (three lines of light), `straight`, `elbow` and
    `arc`, with `defineTourPath` and `routeThrough` for your own. Routes may carry companion `strands`. Curved
    styles leave along `leave` (straight out of the card edge) and meet the target's edge square on;
    `edgeNormal`, `inflate` and `meetPoint` (in `hintbeam/core`) help custom styles. Each end's reach grows with
    the distance travelled, so lights are smooth S-curves at any angle, and they meet wide targets at
    the nearest point of the facing edge's middle half.
  - Card placement: `placeStep` puts the card beside its target (below, above, right, left), docks
    it on phones and toward a scrolled-away target, and returns where the guide sits. `edgeBeacon`
    marks the screen edge a scrolled-away target is past.
- **Plugin API v1:**
  - `TourPlugin` with `paths`, `tours`, `canStart`, `onEvent` and `setup`.
  - `TourPluginApi` with `start`, `stop`, `getState`, `addTours` and `drawnTargets`.
  - The `user` context, and `meta` on tours and steps.
- **React layer:**
  - Components and hooks: `TourProvider`, `useTarget`, `useScreenLink`, `useTour`, `useTours` and
    `useTourStep`.
  - Looks from plain to magical: `createTourTheme({ brand, mode, style })` builds a full theme from a
    brand colour, light or dark cards, and one of four `TOUR_STYLES` — `aurora`, `balanced`
    (default), `subtle`, `minimal`. Every part can still be overridden.
  - Themes (`TOUR_THEMES.light`, `TOUR_THEMES.dark`) with `accent2`, `border`, `guide`, `backdrop`, `glow` (one
    dial for every glow), `motion` (`full`, `calm`, `none`) and `path`, and
    translatable `labels` (including `yourTurn`).
  - `useTourStep` gives `track()` and `key`, for custom UIs that follow the page.
  - `useTour().startOnce(tour)` for first-visit tours: it plays only if the user has never finished
    or skipped the tour, and waits for saved progress before deciding, so it is right with
    asynchronous storage such as AsyncStorage. It resolves to `"seen"` when it does nothing.
  - Targets that render late are found the moment they mount, even while their step is showing.
- **The built-in step UI** (web and native):
  - The guide: a living light on the card's edge that leans toward the target, breathes faster
    while a step waits, and searches when the target is elsewhere. Also exported as `GuideOrb`.
  - The light leaves the guide, blends `accent` → `accent2`, draws once per step and then follows
    the target every frame while anything scrolls (web). A scrolled-away target gets a glow and a
    chevron on the screen edge it is past.
  - Spotlight backdrop with a cut-out around the target (never blocks anything), a traced and
    pulsing highlight, a progress bar, word-by-word text and a "Your turn" state. Skip sits apart from Back and the main button.
  - Custom or headless step UIs through `renderStep`.
- **Web platform:**
  - `browserTourStorage()` keeps progress in `localStorage`, and is safe in server rendering.
  - Measures elements with the DOM; the page itself is the default scroll area.
  - The step card renders in a portal, with an SVG light animated in CSS.
  - Keyboard: Esc skips, → goes to the next step, ← goes back.
  - Respects reduced motion, and is marked `"use client"` for the Next.js App Router.
- **Native platform:**
  - Measures with `measureInWindow` and draws the light with react-native-svg.
  - Announces steps to screen readers and respects reduced motion.
  - `useTourScroll` for ScrollViews.
- **Router adapters:** Next.js, React Router, Expo Router, React Navigation, and
  `useRouterAdapter` for any other router.
- **Documentation and website:** guides in `docs/`, and the website in `site/` (Next.js, static), which uses the package itself.
