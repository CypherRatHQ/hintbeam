# Plugins

Plugins add to a tour without forking it. A plugin is a plain object:

```ts
import type { TourPlugin } from "hintbeam";

const analytics: TourPlugin = {
  name: "analytics",
  onEvent(event) {
    track(`tour_${event.type}`, { tour: event.tour.id, step: "index" in event ? event.index : undefined });
  },
};

<TourProvider plugins={[analytics]} … />
```

| Hook | Use it for |
| --- | --- |
| `name` | Required, unique. Shown in development warnings |
| `paths` | Add path styles: `{ zigzag: myStyle }`, then `path="zigzag"` |
| `tours(context)` | Supply tours as data — a CMS, a file, a hosted editor. Each is validated first |
| `onEvent(event, context)` | Every `start`, `step`, `complete`, `skip`, `stop` — analytics, logging |
| `canStart({ tour, completed, user, platform })` | Decide whether a tour may start — audiences, frequency caps, experiments, entitlements. Return `false` to block; `start()` then resolves to `"blocked"` |
| `setup(api)` | Drive tours: start, stop, add tours at runtime, list the targets on screen. Return a cleanup |
| `apiVersion` | The plugin API version you wrote against (currently `1`) |

Rules that keep plugins safe:

- **A failing plugin never breaks a tour.** Errors in `onEvent` are reported and ignored; a
  `canStart` that throws is treated as "allow".
- **Plugins add, they don't replace.** They cannot change how targets are found, how steps end or
  what the card does.
- **Every plugin must agree** for a tour to start.

## Examples

Show a tour only once:

```ts
const onlyOnce: TourPlugin = { name: "only-once", canStart: ({ completed }) => !completed };
```

Only for new users:

```ts
const newUsers: TourPlugin = { name: "new-users", canStart: () => user.createdAt > Date.now() - 7 * 864e5 };
```

## Tours from anywhere

A plugin can supply tours as plain data — from a CMS, a JSON file, a hosted editor. Every tour is
validated against your declared targets before it can play; invalid ones are reported and left out.

```ts
const cms: TourPlugin = {
  name: "cms",
  async tours({ user }) {
    const response = await fetch(`/api/tours?locale=${user?.traits?.locale ?? "en"}`);
    return response.json();
  },
};

const { start } = useTour();
start("first-meal");             // by id, from any plugin or <TourProvider tours={[…]}>
const tours = useTours();        // everything that can be started, e.g. for a help menu
```

## Knowing who the user is

```tsx
<TourProvider user={{ id: account.id, traits: { plan: account.plan, signedUpAt: account.createdAt } }} … />
```

`user` is handed to `canStart` and `onEvent`. hintbeam itself never sends it anywhere.

## Driving tours from a plugin

`setup(api)` runs when the provider mounts and may return a cleanup. `api` can `start`, `stop`,
`getState`, `currentScreen`, `addTours`, and list `drawnTargets()` — the named targets on screen
right now, with their boxes. That is everything a live preview or a visual editor needs:

```ts
const livePreview: TourPlugin = {
  name: "live-preview",
  setup(api) {
    const socket = new WebSocket("wss://editor.example.com/preview");
    socket.onmessage = (message) => {
      const { added } = api.addTours([JSON.parse(message.data)]);
      if (added[0]) void api.start(added[0]);
    };
    return () => socket.close();
  },
};
```

## Metadata

Tours and steps accept `meta` — plain JSON up to 4 KB that travels with the tour and is never shown
to users. Use it for versions, experiments, audiences or editor notes.

## Versioning

`TOUR_PLUGIN_API_VERSION` is the version of this contract (currently 1). Set `apiVersion` on your plugin;
the provider warns when a plugin needs a newer hintbeam. The contract only changes in
backwards-compatible ways within a major version.

## Open source, and what may come later

Everything in this repository — every platform, router, path style and this plugin API — is MIT and
stays MIT. The library never checks a licence key and never phones home.

Add-ons that need a server — hosted tour editing, live preview, analytics dashboards, audience
targeting, cross-device progress — may be offered separately. They plug in through exactly the API
on this page, so nothing in the open-source library is held back, and a free user never runs code
they did not choose to install.
