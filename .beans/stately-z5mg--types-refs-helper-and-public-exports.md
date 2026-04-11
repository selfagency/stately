---
# stately-z5mg
title: Types, refs helper, and public exports
status: completed
type: feature
priority: high
created_at: 2026-04-11T00:12:07Z
updated_at: 2026-04-11T01:04:32Z
parent: stately-ceif
---

## Goal

Provide strict typings, a safe `storeToRefs()` helper, and a stable public API surface.

## Todo

- [x] Add core public typings.
- [x] Add reactive `storeToRefs()` helper.
- [x] Finalize public package exports.

## Summary of Changes

- Added the public typing layer for store state, getters, actions, store instances, definitions, and action/mutation contexts.
- Added a reactive `storeToRefs()` helper that skips actions and `$`-prefixed internals.
- Published the stable core API through `src/lib/index.ts` with targeted entrypoint coverage.
