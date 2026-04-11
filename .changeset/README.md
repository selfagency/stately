# Changesets

This directory stores release intent files for the `stately` package.
Create a new changeset whenever a pull request should produce a new npm version or changelog entry.

When versioning runs, Changesets updates the root `CHANGELOG.md`.
The release build then copies that changelog into `dist/` alongside the stripped release manifest so npm publishes the consumer-facing package surface instead of the workspace metadata.

Common commands:

- `pnpm changeset`
- `pnpm changeset:version`
- `pnpm release`
- `pnpm release:dry-run`
