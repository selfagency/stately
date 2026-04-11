---
# stately-jij6
title: Add unit test coverage for the library runtime
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:13:52Z
updated_at: 2026-04-11T05:02:22Z
parent: stately-2nan
blocked_by:
  - stately-0zqz
---

## Todo

- [x] Add `define-store.spec.ts` and `patching.spec.ts`.
- [x] Add `history.spec.ts` and `persistence.spec.ts`.
- [x] Add `sync.spec.ts` and `async.spec.ts`.
- [x] Verify plugin interactions and edge cases described in the main plan.

## Summary of Changes

- Added explicit runtime coverage files for patching, history, persistence, sync, and async orchestration.
- Kept the tests focused on public store behavior and cross-plugin interactions.
- Verified persistence/history replay suppression, sync across managers, and async restartable behavior from integration-style tests.
