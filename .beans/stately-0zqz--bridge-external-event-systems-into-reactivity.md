---
# stately-0zqz
title: Bridge external event systems into reactivity
status: completed
type: task
priority: normal
created_at: 2026-04-11T00:13:38Z
updated_at: 2026-04-11T03:33:21Z
parent: stately-2rnr
blocked_by:
  - stately-doyt
---

## Todo

- [x] Create `src/lib/async/external-subscribe.ts`.
- [x] Use `createSubscriber` for browser or network event integrations.
- [x] Provide a reusable pattern for future websocket or observer-backed stores.

## Summary of Changes

- Added `src/lib/async/external-subscribe.ts` using `createSubscriber` from `svelte/reactivity`.
- Exposed a reusable `current`-value bridge for external event and observer-backed sources.
- Added targeted tests covering subscription setup, updates, and cleanup.
