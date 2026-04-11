---
# stately-71wr
title: Scaffold root manager and SSR context modules
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:12:44Z
updated_at: 2026-04-11T00:57:44Z
parent: stately-os3w
---

## Todo

- [x] Create `src/lib/root/create-state-manager.ts` with the root manager interface and lifecycle skeleton.
- [x] Create `src/lib/root/state-manager-context.ts` with Svelte context helpers for request-scoped access.
- [x] Create `src/lib/root/types.ts` for manager, plugin, and lifecycle contracts.
- [x] Document SPA-only versus SSR-safe manager usage in code-level type comments where needed.

## Summary of Changes

- Added root manager lifecycle and plugin contracts in `src/lib/root/types.ts`.
- Implemented `createStateManager()` with definition registration, plugin registration, per-manager store caching, and store cleanup helpers.
- Added typed context helpers in `src/lib/root/state-manager-context.ts` for request-scoped manager provisioning.
- Added targeted unit coverage for isolated managers and duplicate definition rejection.
