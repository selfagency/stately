---
# stately-f1rl
title: Add npm publish and release workflow
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T16:10:00Z
parent: stately-b8rl
blocked_by:
  - stately-e0ci
---

## Todo

- [x] Create `.github/workflows/release.yml` for npm-library publishing.
- [x] Define the publish trigger and versioning flow for releases.
- [x] Configure provenance-friendly publish settings and secret or trusted-publisher requirements.
- [x] Ensure release automation does not publish when validation fails.
- [x] Publish the built `dist/` output with a release-only manifest and changelog instead of the root workspace package metadata.

## Summary of Changes

- Added `.github/workflows/release.yml` for main-branch and manual release automation.
- Configured the workflow to rerun the same repository validation steps before Changesets can version or publish.
- Added provenance-friendly settings and documented support for either `NPM_TOKEN` publishing or GitHub OIDC trusted publishing through workflow permissions.
- Switched the release workflow to custom version and publish hooks so release publishing now runs `node scripts/release.js` against the prepared `dist/` package instead of publishing the workspace root.
