# Versioning and releases

hintbeam follows [Semantic Versioning](https://semver.org). This page says exactly what that
promises, so you can upgrade without reading the source.

## What counts as the public API

The public API is everything you can import from these entry points, with the shapes they have:

`hintbeam` · `hintbeam/web` · `hintbeam/native` · `hintbeam/core` ·
`hintbeam/next` · `hintbeam/react-router` · `hintbeam/expo-router` ·
`hintbeam/react-navigation`

It also covers:
- the tour format that `parseTour` accepts (JSON tours stored in a database keep working);
- the progress format written to storage (saved progress survives upgrades);
- the plugin API, versioned separately as `TOUR_PLUGIN_API_VERSION`.

Theme the card through `theme` (or `createTourTheme`). The `--hb-*` CSS custom properties the card
sets are not public yet; they become public once listed in [Customising](customising.md).

Not public: anything reached through a deep path such as `hintbeam/dist/...`, class names
beginning with `hb-`, and the exact pixels of the built-in card. The card's look improves in minor
releases. If you need it frozen, use `renderStep` or the headless `useTourStep`.

Every export and its shape is recorded in [`api/surface.txt`](../api/surface.txt). CI fails if it
changes without the file being updated in the same pull request, so the API can never change by
accident.

## What each kind of release may do

| Release | May | May not |
| --- | --- | --- |
| **Patch** `1.2.x` | Fix bugs, improve docs, make things faster | Change behaviour you could reasonably rely on |
| **Minor** `1.x.0` | Add exports, options, path styles and labels; deprecate things; refine the default look | Remove or rename anything; change a type so existing code stops compiling |
| **Major** `x.0.0` | Remove what an earlier minor deprecated; raise the minimum React, React Native or Node version | Surprise you: every change is in the changelog with its upgrade step |

### Before 1.0

While the version starts with `0.`, the **minor number acts as the major**:
- `0.3.0` may contain breaking changes, but only ones deprecated in `0.2.x`, with a warning first.
- `0.2.4` contains only fixes and additions.

We aim for 1.0 once the API has held still through real use, including React Native on devices.

## Deprecation, step by step

1. **Announce:** in a minor release, the old way keeps working. It is marked `@deprecated` in the
   types, so editors strike it through, and it logs one warning in development, naming the
   replacement.
2. **Wait:** it stays for at least one full minor release, and in practice for the rest of that
   major.
3. **Remove:** only in the next major. The changelog entry includes the upgrade step, and a codemod
   when the change is mechanical.

## Supported versions

| Dependency | Supported |
| --- | --- |
| React | ≥ 18 |
| React Native | ≥ 0.73 (with `react-native-svg` ≥ 13) |
| Next.js | ≥ 13.4 (App Router) |
| React Router | ≥ 6 |
| Expo Router | ≥ 3 |
| React Navigation | ≥ 6 |
| Node (for `hintbeam/core` on servers and in CI) | maintained LTS versions |

Dropping a version from this table is a major change.

Security fixes go to the latest minor of the current major. They also go to the last minor of the
previous major for six months after a new major ships.

## Plugins

Plugins declare `apiVersion`. The plugin API is versioned on its own:
- **Additions** keep `TOUR_PLUGIN_API_VERSION` the same.
- **A breaking change to the plugin API** raises it, and happens only in a major release of the
  library.

A plugin built for an older version keeps working, or is skipped with a clear warning — it never
fails silently.

## Release channels

- **`latest`:** the default, from `npm i hintbeam`.
- **`next`:** previews of the coming release, from `npm i hintbeam@next`, versioned
  `0.4.0-next.1` and so on. Previews may change between builds. Use them to try what's coming, not
  in production.

## How a change becomes a release

This is for contributors; see also [CONTRIBUTING](../CONTRIBUTING.md).

1. **Branch from `main`.** `main` is always releasable. Commit messages follow
   [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, …).
2. **Add a changeset** for anything users can notice: `npx changeset`. Choose patch, minor or
   major, and write the summary for the person upgrading.
3. **Run `npm run check`.** It runs the types, tests, the API-surface check and formatting. If the
   API changed on purpose, run `npm run api:update` and commit `api/surface.txt` too.
4. **Merge the pull request.** CI then opens a "Version packages" pull request that bumps the
   version and writes the changelog from the changesets.
5. **Merge that pull request to publish** to npm, with a git tag `vX.Y.Z` and release notes. A
   maintainer approves this step; nothing publishes on its own.
