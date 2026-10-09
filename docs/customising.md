# Customising

## Brand colour and style — the quick way

```tsx
import { TourProvider, createTourTheme } from "hintbeam";

<TourProvider theme={createTourTheme({ brand: "#E5484D", mode: "light", style: "subtle" })} … />
```

- **`brand`:** your colour. The light, the highlight and the main button are made from it. The
  light blends into a neighbouring hue; pass `brand2` to choose the second colour, or the same colour
  for a flat look. Button text turns dark on light brand colours.
- **`mode`:** `"light"` or `"dark"` cards.
- **`style`:** how much is going on.

| `style` | Looks like | For |
| --- | --- | --- |
| `"aurora"` | Three strands of light, the guide, a soft glow and spotlight | Launch moments, first-run tours |
| `"balanced"` *(default)* | The guide and a single wave, softly lit | Most apps |
| `"subtle"` | A thin straight line and a quiet card; no guide; nothing keeps moving | Busy, serious or data-heavy apps |
| `"minimal"` | An outline around the target and a card beside it, like a tooltip; no light or dimming | When the tour should barely be noticed |

Change anything else with `overrides`:
`createTourTheme({ brand, style: "subtle", overrides: { radius: 8, glow: 0.3 } })`. The
[playground](https://hintbeam.js.org/playground) has every control, and writes this code for you.

## Theme

```tsx
import { TourProvider, TOUR_THEMES } from "hintbeam";

<TourProvider theme={TOUR_THEMES.dark} … />
<TourProvider theme={{ accent: "#E5484D", radius: 12, fontFamily: "Inter" }} … />
```

| Key | Default | |
| --- | --- | --- |
| `accent`, `accent2` | violet, sky blue | The light blends from `accent` to `accent2`; the main button too. Set only `accent` for a flat look |
| `onAccent` | `#FFFFFF` | Text on the main button |
| `card`, `border`, `text`, `mutedText` | frosted white, hairline, near-black, grey | The card. A translucent `card` gives frosted glass on the web |
| `radius` | `16` | Card corners |
| `inset` | `{ top: 56, bottom: 32, horizontal: 16 }` | Distance from screen edges — set `top` below a sticky header |
| `maxCardWidth` | `360` | On tablets and desktops |
| `fontFamily` | your page's font | |
| `light` | `true` | `false`: highlight only, no light |
| `guide` | `true` | The guide on the card's edge (below). `false` hides it |
| `backdrop` | `0.2` (`0.35` dark) | How much the rest of the screen dims around the target, 0–1. `0` turns the spotlight off. Nothing is ever blocked |
| `glow` | `0.4` | One dial for every glow — the light, the highlight, the card and the guide. `0` is flat |
| `motion` | `"full"` | `"full"`: words arrive one by one, a spark keeps travelling, the target ripples. `"calm"`: the light draws once and everything else stays still. `"none"`: no motion (also what anyone with reduced motion gets) |
| `path` | — | The light style when `TourProvider` has no `path` prop |
| `zIndex` | `2147483000` | Web only |

## Where the card goes

Next to its target: below it when there is room, then above, right, left. When none fits — and
always on phones narrower than 640 — the card docks to the screen edge away from the target. For a
target scrolled out of view it docks *toward* it, and the light runs to the edge the target is past,
with a glow and a chevron there. While anything scrolls, the card, the light and the highlight
follow the target every frame. The placement is one pure function, `placeStep`, shared by web and
native.

## The guide

Every card has a small living light on the edge facing its target — the guide. The light of each
step leaves from it, and it shows its mood: it **leans toward** what it points at, **breathes faster**
while a step waits for the user, and **searches** (dimmer, ring spinning) when the target is on
another page or not found. Turn it off with `theme={{ guide: false }}`.

Use it elsewhere — a help button, an empty state — with `GuideOrb`:

```tsx
import { GuideOrb } from "hintbeam";

<button onClick={() => start("first-meal")}>
  <GuideOrb size={24} mood="point" accent="#9D86FF" accent2="#4CD6FF" /> Show me around
</button>
```

## Words and translations

Every word users read comes from `labels`:

```tsx
<TourProvider
  labels={{
    next: "Siguiente",
    back: "Atrás",
    skip: "Saltar",
    done: "Listo",
    showMe: "Muéstrame",
    takeMeThere: "Llévame",
    notFound: "No encuentro esto aquí ahora mismo.",
    yourTurn: "Tu turno",
    stepOf: (n, total) => `Paso ${n} de ${total}`,
  }}
/>
```

`announce(title, text, n, total)` controls what screen readers hear when a step appears.

Tour text itself is your data — keep one tour per language, or build tours from your i18n strings.

## Path styles

How the light travels from the guide to the target:

| `path` | Looks like |
| --- | --- |
| `"wave"` *(default)* | A soft S-curve that leaves with a swing and arrives from the side |
| `"strands"` | Three lines of light: the wave, with two fainter strands fanned out beside it that gather at the target — the most magical |
| `"straight"` | The shortest line — calm, clearest on busy screens |
| `"elbow"` | Down, then across, with a rounded corner — reads like a diagram |
| `"arc"` | One generous arc — playful, good over long distances |

```tsx
<TourProvider path="elbow" … />
```

### Your own path style

A style is a pure function from a start point and a target box to a route. `routeThrough` turns
Bézier segments into a route with evenly spaced points, so a new style is a few lines:

```ts
import { defineTourPath } from "hintbeam";
import { nearEdge, routeThrough, type Point } from "hintbeam/core";

export const zigzag = defineTourPath((from, to, options) => {
  const end = nearEdge(from, to);
  const mid = { x: (from.x + end.x) / 2 + 40, y: (from.y + end.y) / 2 };
  const line = (a: Point, b: Point): [Point, Point, Point] => [
    { x: a.x + (b.x - a.x) / 3, y: a.y + (b.y - a.y) / 3 },
    { x: a.x + (2 * (b.x - a.x)) / 3, y: a.y + (2 * (b.y - a.y)) / 3 },
    b,
  ];
  return routeThrough(from, [line(from, mid), line(mid, end)], options?.samples);
});

<TourProvider plugins={[{ name: "zigzag", paths: { zigzag } }]} path="zigzag" … />
```

Every renderer draws every style, on every platform — styles never touch the screen.

## Your own step card

Render anything with `renderStep`:

```tsx
<TourProvider
  renderStep={(step) => (
    <MyPopover anchor={step.highlight?.box}>
      <h3>{step.step?.title}</h3>
      <p>{step.step?.text}</p>
      {step.primary === "takeMeThere" && <button onClick={step.takeMeThere}>Go</button>}
      {step.primary === "showMe" && <button onClick={step.showMe}>Show me</button>}
      {(step.primary === "next" || step.primary === "done") && <button onClick={step.next}>Next</button>}
      <button onClick={step.skip}>Skip</button>
    </MyPopover>
  )}
/>
```

Or pass `renderStep={null}` and call `useTourStep()` from any component — a fully headless tour.
`step.where` tells you exactly where the target is (`visible`, `offscreen`, `otherScreen`, `notFound`).

## Waiting for your app

A step can wait for something to happen in your app:

```ts
{ target: "exportButton", text: "Export this report.", advanceOn: { event: "report.exported" } }
```

```tsx
const { emit } = useTour();
async function exportReport() {
  await api.export();
  emit("report.exported");
}
```

Declare the event names in `defineTargets(…, { events: ["report.exported"] })` to have typos caught.
