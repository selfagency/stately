---
# stately-xuj5
title: Run final validation and fix release blockers
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:13:57Z
updated_at: 2026-04-11T05:16:29Z
parent: stately-nzwm
blocked_by:
  - stately-jij6
  - stately-1g3n
  - stately-bf6a
  - stately-nxp3
---

## Todo

- [x] Run `npm run check` and fix type/runtime issues.
- [x] Run `npm run lint` and fix lint issues.
- [x] Run `npm run test` and fix unit/browser test failures.
- [x] Run `npm run build` and fix packaging/export issues.
- [x] Confirm the package is ready for release-quality review.

## Summary of Changes

- Added the missing `license` field to `package.json` so package metadata matches `LICENSE.md` and `publint` is clean.
- Fixed follow-up typing and formatting issues uncovered during final validation across the showcase demo, browser coverage, and runtime integration tests.
- Verified `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` all pass.
