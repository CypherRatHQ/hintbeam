# Contributing

Thanks for looking. This project is small on purpose; the fastest way to help is a focused issue or a
focused pull request. Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

```sh
npm install
npm run check     # types, tests, public-API check, formatting
```

Node 22 or newer. No global tools needed.

## Tests

- `npm test` — vitest over `src/**/*.test.ts`. The core (`src/core/`) is fully unit-tested with fake
  time, storage and measurement; please add a test with every behavioural change.
- The React Native layer is type-checked (`npm run typecheck`) and exercised through the example app.
  A manual pass on a device or Expo web before release is expected for anything touching `src/native/`.

## Proposing a change

1. Open an issue first for anything beyond a bug fix, so scope can be agreed. v1 scope is deliberately
   capped (README, "What it does not do").
2. Branch from `main` and keep the pull request to one change, with its test. Commit messages follow
   [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `refactor:`,
   `test:`, `chore:`; add `!` (`feat!:`) for a breaking change.
3. **Add a changeset** if users can notice the change: `npx changeset`, pick patch, minor or major,
   and write one or two sentences for the person upgrading. Don't edit `CHANGELOG.md` by hand — it
   is written from changesets at release.
4. **If the public API changed**, `npm run check` will say so. When the change is intended, run
   `npm run api:update` and commit `api/surface.txt`. Removing or changing anything there is a
   breaking change: deprecate first ([docs/versioning.md](docs/versioning.md)).
5. Match the surrounding style: two-space indent, double quotes, trailing commas, comments only where
   the code cannot say it.

## Releases

Maintainers release from `main` with Changesets. Merging the "Version packages" pull request
publishes to npm and tags `vX.Y.Z`. The publish job needs a maintainer's approval. The full policy
is in [docs/versioning.md](docs/versioning.md).

## Code of conduct

Be kind, be specific, assume good faith. Maintainers may close contributions that are not.
