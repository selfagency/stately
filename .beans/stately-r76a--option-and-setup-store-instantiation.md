---
# stately-r76a
title: Option and setup store instantiation
status: completed
type: feature
priority: critical
created_at: 2026-04-11T00:12:14Z
updated_at: 2026-04-11T02:14:38Z
parent: stately-5ddl
---

## Goal
Implement runtime instantiation for option stores and setup stores.

## Todo

- [x] Implement option-store runtime.
- [x] Implement setup-store runtime.

## Summary of Changes

- Extracted option-store runtime creation into `src/lib/runtime/create-option-store.svelte.ts`.
- Extracted setup-store runtime creation into `src/lib/runtime/create-setup-store.svelte.ts`.
- Routed `defineStore()` through the dedicated runtime modules and added targeted runtime coverage.
