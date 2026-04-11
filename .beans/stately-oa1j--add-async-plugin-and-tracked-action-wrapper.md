---
# stately-oa1j
title: Add async plugin and tracked action wrapper
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:13:38Z
updated_at: 2026-04-11T03:22:27Z
parent: stately-2rnr
blocked_by:
    - stately-d5b6
---

## Todo

- [x] Create `src/lib/async/plugin.svelte.ts`.
- [x] Create `src/lib/async/track-async-action.svelte.ts`.
- [x] Expose `isLoading`, `error`, `lastSuccessAt`, `lastFailureAt`, and `abort` state per tracked action.
- [x] Ensure sync and failure hooks integrate with `$onAction()` semantics.

## Summary of Changes

- Added `src/lib/async/track-async-action.svelte.ts` for per-action async metadata tracking.
- Added `src/lib/async/plugin.svelte.ts` to augment stores with a `$async` registry and tracked action wrappers.
- Exposed loading, error, success/failure timestamps, and abort handles per tracked action.
- Preserved `$onAction()` behavior by wrapping the existing store action pipeline and added targeted plugin tests.
