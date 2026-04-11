---
# stately-dh46
title: Implement store shell helpers
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:13:04Z
updated_at: 2026-04-11T02:19:59Z
parent: stately-3rjd
blocked_by:
  - stately-ep9j
---

## Todo

- [x] Create `src/lib/runtime/store-shell.svelte.ts`.
- [x] Implement `$id`, `$state`, `$patch`, `$reset`, `$subscribe`, `$onAction`, and `$dispose`.
- [x] Ensure all state changes route through a common mutation hook.
- [x] Add safe reset behavior for option and setup stores.

## Summary of Changes

- Added `src/lib/runtime/store-shell.svelte.ts` to build store helper methods around runtime state.
- Implemented `$state`, `$patch`, `$reset`, `$subscribe`, `$onAction`, and `$dispose` on store instances.
- Routed direct property writes, object patches, function patches, and resets through a shared mutation notification path.
- Updated the option/setup runtimes to build stores through the common shell helper and added targeted shell behavior coverage.
