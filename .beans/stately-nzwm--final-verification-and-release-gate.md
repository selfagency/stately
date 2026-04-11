---
# stately-nzwm
title: Final verification and release gate
status: completed
type: feature
priority: critical
created_at: 2026-04-11T00:12:38Z
updated_at: 2026-04-11T05:16:29Z
parent: stately-uxdm
---

## Goal

Run final validation commands and clear release blockers.

## Todo

- [x] Run check, lint, test, and build.
- [x] Fix packaging, export, and release-blocking issues.

## Summary of Changes

- Cleared the remaining release-blocking issues from the showcase/tests/docs/examples work.
- Added package license metadata and finished with all validation commands green, including `publint` during `pnpm run build`.
