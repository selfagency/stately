---
# stately-ofgb
title: Add core public typings
status: completed
type: task
priority: high
created_at: 2026-04-11T00:12:55Z
updated_at: 2026-04-11T01:02:00Z
parent: stately-z5mg
blocked_by:
  - stately-1qca
---

## Todo

- [x] Define `StoreState`, `StoreGetters`, `StoreActions`, and `StoreDefinition` generics.
- [x] Define mutation and action hook context types.
- [x] Add plugin augmentation interfaces for future extension.
- [x] Verify strict TypeScript inference works for both option and setup stores.

## Summary of Changes

- Added `src/lib/pinia-like/store-types.ts` with public store-state, getter, action, instance, and definition generics.
- Added mutation and action-hook context types for future subscription and action lifecycle work.
- Added plugin augmentation interfaces for store properties, state properties, and future definition options.
- Wired `defineStore()` return types through the public typing layer.
- Added targeted type-contract tests for option stores and action hook context types.
