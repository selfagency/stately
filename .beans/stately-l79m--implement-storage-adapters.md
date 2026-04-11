---
# stately-l79m
title: Implement storage adapters
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:15Z
updated_at: 2026-04-11T04:03:04Z
parent: stately-8rtd
blocked_by:
    - stately-f700
---

## Todo

- [x] Add localStorage adapter.
- [x] Add sessionStorage adapter.
- [x] Add in-memory adapter.
- [x] Add IndexedDB adapter with async get/set/remove/clear/keys operations.

## Summary of Changes

- Added memory, localStorage, sessionStorage, and IndexedDB persistence adapters.
- Kept all adapters on the shared persistence adapter contract so sync and async backends behave consistently.
- Added focused tests covering CRUD and key enumeration behavior across the adapters.
