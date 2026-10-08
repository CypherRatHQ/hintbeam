# Changesets

Every change users can notice ships with a changeset: a small Markdown file that says which version
bump it needs and what it means for them. `npx changeset` writes one. At release time
`npm run version-packages` turns them into the new version and the CHANGELOG entry.

- **patch** — a fix; nothing anyone wrote needs to change.
- **minor** — something new, or a deprecation (with a dev-mode warning and the replacement).
- **major** — a removal or a changed shape. Only after a deprecation in an earlier minor. While the
  version is `0.x`, the minor number plays this role (see `docs/versioning.md`).

Write the summary for the person upgrading: what changed, why they'd care, and the one-line upgrade
step if there is one.
