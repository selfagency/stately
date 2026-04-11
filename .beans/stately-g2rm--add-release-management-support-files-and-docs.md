---
# stately-g2rm
title: Add release management support files and docs
status: completed
type: task
priority: high
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T16:08:00Z
parent: stately-b8rl
blocked_by:
  - stately-f1rl
---

## Todo

- [x] Add `.changeset/` or the chosen release-management configuration.
- [x] Update package publish metadata as needed for npm delivery.
- [x] Document the release flow for maintainers.
- [x] Validate that a dry-run release path is deterministic.
- [x] Add dist-only release packaging files so published artifacts ship a minimal `package.json`, `CHANGELOG.md`, and other consumer-facing metadata.

## Summary of Changes

- Added Changesets configuration, a starter release-intent file, and maintainer release documentation.
- Updated `package.json` with repository, homepage, bug tracker, provenance-aware publish metadata, and release-management scripts.
- Verified the release dry-run path with `pnpm release:dry-run`, including full validation, build, packaging, and Changesets status output.
- Added `scripts/write-dist-package.js`, a root `CHANGELOG.md`, and release docs updates so `dist/` ships a stripped package manifest plus copied release-facing assets.
