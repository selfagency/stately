---
# stately-a7ci
title: CI/CD, contributor hooks, and VitePress documentation
status: completed
type: epic
priority: critical
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T16:12:00Z
parent: stately-pm7k
---

## Goal

Add GitHub Actions automation, local contributor hooks, and a VitePress documentation site for the npm library.

## Todo

- [x] Add CI validation workflows.
- [x] Add npm publish and release automation.
- [x] Add Husky and lint-staged contributor hooks.
- [x] Create and deploy the VitePress documentation site.

## Summary of Changes

- Added pinned GitHub Actions workflows for CI validation, npm release automation, and VitePress docs deployment.
- Added Husky and lint-staged quality gates plus aligned package scripts and contributor guidance.
- Added a VitePress docs site with guide and reference content, then configured it for GitHub Pages at `stately.self.agency` with a generated `CNAME` and root-path base.
- Verified the full repository gates with `pnpm run check`, `pnpm run lint`, `pnpm run test`, `pnpm run build`, and `pnpm run docs:build`.
- Refined release automation so the publish step now emits a release-only `dist/` package with copied consumer-facing assets and a generated changelog.
