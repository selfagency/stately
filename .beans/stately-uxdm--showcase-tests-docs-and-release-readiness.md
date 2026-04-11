---
# stately-uxdm
title: Showcase, tests, docs, and release readiness
status: completed
type: epic
priority: critical
created_at: 2026-04-11T00:11:56Z
updated_at: 2026-04-11T05:16:29Z
parent: stately-pm7k
---

## Goal

Validate the library with a showcase app, automated tests, documentation, examples, and final release checks.

## Todo

- [x] Build the interactive showcase page.
- [x] Add browser and unit test coverage.
- [x] Update README and packaged examples.
- [x] Run final validation commands and clear release blockers.

## Summary of Changes

- Replaced the starter SvelteKit page with a polished interactive showcase covering persistence, history, time travel, sync, and async orchestration.
- Added browser integration coverage for the showcase and integration-focused runtime tests for patching, persistence, history, sync, and async behavior.
- Replaced the starter README with actual library documentation and added packaged example source files under `src/lib/examples/`.
- Cleared release blockers and finished with `check`, `lint`, `test`, `build`, and `publint` all green.
