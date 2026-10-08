# Routers

A router adapter lets tours follow users between screens: it says which screen is in front, and how
to go to another. Screens are named the way your router names them, and your targets use the same
names.

| Router | Import | Screen names |
| --- | --- | --- |
| Next.js App Router | `useNextRouter()` from `hintbeam/next` | pathnames, `"/settings"` |
| React Router 6/7, Remix | `useReactRouter()` from `hintbeam/react-router` | pathnames |
| Expo Router | `useExpoRouter()` from `hintbeam/expo-router` | pathnames, `"/food"` |
| React Navigation 6/7 | `useReactNavigation(navigationRef)` from `hintbeam/react-navigation` | route names, `"Food"` |
| None | leave `router` out | everything is one screen |

Each adapter is optional: install only the router you use. The provider must sit where the router's
hooks work — inside `<BrowserRouter>`, inside the Next.js layout, in Expo's root `_layout.tsx`. React
Navigation takes a ref instead, so its provider can sit outside `NavigationContainer`.

## Pointing at the way to a screen

When a step's target is on another screen, the tour highlights the link to that screen and offers
**Take me there**. Mark links with `useScreenLink`:

```tsx
const reportsLink = useScreenLink("/reports");
<a ref={reportsLink} href="/reports">Reports</a>
```

Without one, "Take me there" still works — there's just nothing to highlight.

## Any other router

`useRouterAdapter(currentScreen, navigate)` turns anything into an adapter:

```tsx
import { useRouterAdapter } from "hintbeam";

const router = useRouterAdapter(window.location.hash.slice(1) || "/", (to) => {
  window.location.hash = to;
});
```

TanStack Router, Wouter, a state machine, a tab component — if it has "where am I" and "go there",
it works. For tests and storybooks, `createManualRouter("/start")` gives you one you drive by hand.

## Dynamic routes

Screens match exactly. For `/projects/42`, declare the target's screen as the path the user will be on
when the tour runs, or build the tour at runtime:

```ts
const tour = defineTour(targets, { id: `project-${id}`, steps: [...] });
```

Pattern matching (`/projects/:id`) is planned.
