---
# stately-ep9j
title: Implement setup-store runtime
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:13:00Z
updated_at: 2026-04-11T02:14:38Z
parent: stately-r76a
blocked_by:
  - stately-vcn2
---

## Todo

- [x] Create `src/lib/runtime/create-setup-store.svelte.ts`.
- [x] Classify returned members into state, getters, and actions.
- [x] Guard against private/non-returned state breaking serialization or plugins.
- [x] Verify method binding and exposed-member typing.

## Summary of Changes

- Added `src/lib/runtime/create-setup-store.svelte.ts` and moved the setup-store runtime out of `defineStore()`.
- Bound returned action methods to the exposed store instance while preserving returned state and getter members.
- Scoped runtime behavior to returned members only, avoiding accidental exposure of non-returned local setup state.
- Added targeted tests covering live state, getters, method binding, and exposed-member behavior.
