---
# stately-iyno
title: Build the interactive showcase page
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:44Z
updated_at: 2026-04-11T04:56:46Z
parent: stately-t0u5
blocked_by:
  - stately-6385
  - stately-pnt3
  - stately-doyt
---

## Todo

- [x] Replace `src/routes/+page.svelte` with a demo for core store usage.
- [x] Demonstrate persistence, undo/redo, time travel, multi-tab sync, and async cancellation.
- [x] Include SSR-safe manager wiring patterns in the showcase structure.
- [x] Make the demo suitable for both manual testing and package marketing.

## Summary of Changes

- Replaced the starter route with an interactive Stately showcase page.
- Added a dedicated showcase demo helper that wires persistence, history, sync, and async plugins together against the public API.
- Demonstrated synced tabs, persistence save/restore, batched history, time travel, async cancellation, and SSR-safe manager guidance in one marketing-ready page.
