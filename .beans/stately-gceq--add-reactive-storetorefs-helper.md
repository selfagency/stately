---
# stately-gceq
title: Add reactive storeToRefs helper
status: completed
type: task
priority: high
created_at: 2026-04-11T00:12:55Z
updated_at: 2026-04-11T01:04:32Z
parent: stately-z5mg
blocked_by:
  - stately-ofgb
---

## Todo

- [x] Create `src/lib/pinia-like/store-to-refs.svelte.ts`.
- [x] Ensure extracted members stay reactive under Svelte 5 constraints.
- [x] Exclude action methods from ref extraction.
- [x] Add typings for state and getter extraction behavior.

## Summary of Changes

- Added `src/lib/pinia-like/store-to-refs.svelte.ts` with ref-like wrappers that stay live against store members.
- Skipped action methods and `$`-prefixed internals from extraction.
- Added targeted runtime and type-level coverage for extracted state and getter members.
