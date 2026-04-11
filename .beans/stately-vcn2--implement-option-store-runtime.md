---
# stately-vcn2
title: Implement option-store runtime
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:13:00Z
updated_at: 2026-04-11T02:11:03Z
parent: stately-r76a
blocked_by:
  - stately-vclu
---

## Todo

- [x] Create `src/lib/runtime/create-option-store.svelte.ts`.
- [x] Convert `state()` output into reactive store state.
- [x] Bind getters as derived accessors and actions as store-bound methods.
- [x] Verify direct property mutation flows through the runtime correctly.

## Summary of Changes

- Added `src/lib/runtime/create-option-store.svelte.ts` and moved the option-store runtime out of `defineStore()`.
- Converted option-store `state()` output into reactive property accessors.
- Bound getters as computed accessors and actions as store-bound methods.
- Added targeted tests covering direct property mutation, getters, and actions.
