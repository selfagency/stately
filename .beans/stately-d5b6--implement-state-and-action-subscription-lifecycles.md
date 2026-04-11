---
# stately-d5b6
title: Implement state and action subscription lifecycles
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:08Z
updated_at: 2026-04-11T02:29:36Z
parent: stately-thq4
blocked_by:
    - stately-pz6d
---

## Todo

- [x] Create `src/lib/runtime/subscriptions.ts`.
- [x] Implement mutation subscription callbacks and detached subscription behavior.
- [x] Implement action hooks with `after` and `onError` callbacks.
- [x] Ensure cleanup works inside and outside components.

## Summary of Changes

- Added `src/lib/runtime/subscriptions.ts` to manage mutation subscriptions and action hook lifecycles.
- Implemented detached-style mutation subscriptions with explicit unsubscribe behavior.
- Added action hook support with `after` and `onError` callbacks for sync and async actions.
- Routed the store shell through the extracted registry and added targeted lifecycle tests.
