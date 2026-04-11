---
# stately-os3w
title: Root manager and store definition
status: completed
type: feature
priority: critical
created_at: 2026-04-11T00:12:07Z
updated_at: 2026-04-11T00:59:41Z
parent: stately-ceif
---

## Goal

Implement the manager primitives and `defineStore()` entry point.

## Todo

- [x] Scaffold root manager, plugin registry, and SSR context modules.
- [x] Implement `defineStore()` for option and setup stores.

## Summary of Changes

- Completed the root manager primitives and request-scoped context helpers.
- Added a working `defineStore()` entry point with option/setup support, store-id validation, and manager-bound store caching.
