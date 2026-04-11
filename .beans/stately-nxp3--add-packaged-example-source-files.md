---
# stately-nxp3
title: Add packaged example source files
status: completed
type: task
priority: normal
created_at: 2026-04-11T00:13:52Z
updated_at: 2026-04-11T05:13:21Z
parent: stately-2nan
blocked_by:
    - stately-bf6a
---

## Todo

- [x] Create `src/lib/examples/option-store` examples.
- [x] Create `src/lib/examples/setup-store` examples.
- [x] Add persistence, history, sync, and async focused examples.
- [x] Ensure examples mirror the final public API exactly.

## Summary of Changes

- Added packaged example source files for option stores, setup stores, persistence, history, sync, and async orchestration under `src/lib/examples/`.
- Expanded the root package exports so examples and consumers can use the shipped adapters and compression helper through the public API.
- Added public-entrypoint coverage for the expanded export surface.
