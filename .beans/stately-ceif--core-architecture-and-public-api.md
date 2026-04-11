---
# stately-ceif
title: Core architecture and public API
status: completed
type: epic
priority: critical
created_at: 2026-04-11T00:11:56Z
updated_at: 2026-04-11T01:04:32Z
parent: stately-pm7k
---

## Goal

Establish the root manager architecture, `defineStore()` entry point, and stable public API surface.

## Todo

- [x] Implement root manager and SSR context primitives.
- [x] Implement `defineStore()` for option and setup stores.
- [x] Add core typings, `storeToRefs()`, and stable exports.

## Summary of Changes

- Implemented root manager creation, plugin registration, definition registration, store caching, and request-scoped context helpers.
- Added a working `defineStore()` entry point with option-store and setup-store support.
- Added the core public typing layer, a reactive `storeToRefs()` helper, and a stable public entrypoint.
- Added focused unit coverage for the root manager, store definition API, type contracts, ref extraction, and entrypoint exports.
