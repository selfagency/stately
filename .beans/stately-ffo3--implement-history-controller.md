---
# stately-ffo3
title: Implement history controller
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:13:19Z
updated_at: 2026-04-11T04:08:15Z
parent: stately-f14e
blocked_by:
    - stately-pz6d
    - stately-f700
---

## Todo

- [x] Create `src/lib/history/plugin.svelte.ts`.
- [x] Create `src/lib/history/history-controller.svelte.ts`.
- [x] Implement `undo`, `redo`, `canUndo`, `canRedo`, and bounded history retention.
- [x] Support explicit batch start/end grouping.

## Summary of Changes

- Added a history controller with bounded retention, undo/redo, and explicit batch grouping.
- Added a history plugin that records store snapshots and exposes `$history` controls.
- Added focused tests covering retention, batching, and plugin-driven undo/redo behavior.
