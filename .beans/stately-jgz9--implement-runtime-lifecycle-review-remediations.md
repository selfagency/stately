---
# stately-jgz9
title: Implement runtime lifecycle review remediations
status: completed
type: bug
priority: high
created_at: 2026-04-12T16:29:43Z
updated_at: 2026-04-12T16:39:23Z
---

## Todo

- [x] Add regression test for debounced persistence clear semantics
- [x] Add regression test for `deleteStore()` disposal
- [x] Fix persistence clear/dispose lifecycle behavior
- [x] Fix `deleteStore()` teardown behavior
- [x] Run targeted tests

## Context

Address the reviewed runtime lifecycle findings in persistence and state manager teardown first, before broader sync/async follow-up work.

## Summary of Changes

- added regression coverage for debounced persistence clearing and store-manager deletion teardown
- fixed the persistence plugin so `$persist.clear()` cancels pending debounced writes before removing stored state
- fixed `createStateManager().deleteStore(id)` to dispose stores before removing them
- updated reference docs for persistence clear behavior and `deleteStore()` teardown semantics
- validated the slice with `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`
