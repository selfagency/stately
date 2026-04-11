---
# stately-1qca
title: Implement defineStore entry point
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:12:44Z
updated_at: 2026-04-11T00:59:41Z
parent: stately-os3w
blocked_by:
  - stately-71wr
---

## Todo

- [x] Create `src/lib/define-store.svelte.ts` supporting option-store signatures.
- [x] Add setup-store overloads and bind store definitions to a concrete manager instance.
- [x] Enforce unique store ids and consistent store registration semantics.
- [x] Add error messages for invalid definition shapes.

## Summary of Changes

- Added `src/lib/define-store.svelte.ts` with option-store and setup-store overloads.
- Bound store instances to concrete state managers with per-manager caching.
- Added duplicate definition protection across store ids.
- Added runtime validation for invalid options/setup shapes.
- Added targeted tests covering option stores, setup stores, duplicate ids, and invalid definitions.
