# Agent entry point

Hintbeam — product tours and guided flows for React, Next.js and React Native, defined as typed
data and pointed at named targets instead of selectors.

## Before changing anything

- Read `README.md` for what this is and how it is used.
- Read `CONTRIBUTING.md` for setup, tests and conventions.

## Layout

```
src/
├── core/        platform-free: targets, tour validation, registry, geometry, paths, layout, resolve, player, progress, plugins
├── react/       shared React layer: TourProvider, hooks, theme, labels (no DOM, no React Native)
├── web/         the browser: StepCard, the light, DOM measuring
├── native/      React Native: StepCard, Light, GuideOrb, scroll areas
└── routers/     router adapters: next, react-router, expo-router, react-navigation
site/            hintbeam.js.org — Next.js static site built with the packed library
```

`src/core/` must stay free of React and React Native imports. Everything in it is unit-tested with
injected time, storage and measurement; add a test with every rule you add.

## Conventions

- TypeScript 5, strict, `noUncheckedIndexedAccess`. ESM. Node ≥ 20 for tooling.
- `npm test` runs vitest over `src/**/*.test.ts`. `npm run typecheck` runs `tsc` over `src/`.
- Prettier is configured; `npm run check` runs typecheck, tests, the public API check and format check.
- Naming: `import … from "hintbeam"` is the app API. Every export there is a hook (`use…`) or says
  "tour" (`TourThing`, `createTourThing`, `TOUR_THING`); groups of built-ins are `TOUR_*` records.
  Engine pieces (player, registry, geometry, path maths) live only in `hintbeam/core`.
  `scripts/api-surface.mjs` fails on a generic name. See docs/api.md, "Naming".

## Rules

- Keep this project self-contained. No imports from outside this directory.
- Match the surrounding code's style, naming and comment density.
- Tests proportional to risk; every bug fix gets a regression test.
- Do not claim security, accessibility compliance or production readiness without evidence.
- Do not add a dependency without a stated reason. The core has zero runtime dependencies; the RN
  layer peers only `react`, `react-native`, `react-native-svg`.
- v1 scope is capped. Discuss scope changes in an issue before opening a pull request.

## Tool-specific files

`CLAUDE.md`, `GEMINI.md` and similar must point here rather than duplicate these rules.
