---
# stately-6385
title: Implement time-travel replay
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:19Z
updated_at: 2026-04-11T04:11:15Z
parent: stately-f14e
blocked_by:
    - stately-ffo3
---

## Todo

- [x] Create `src/lib/history/time-travel.svelte.ts`.
- [x] Replay historical snapshots through the same mutation pipeline as normal updates.
- [x] Prevent persistence and sync feedback loops during replay mode.
- [x] Expose replay metadata for the showcase debugger.

## Summary of Changes

- Added a dedicated time-travel controller with replay metadata and direct index navigation.
- Routed replay through the normal store patch pipeline via history controller navigation.
- Suppressed persistence and sync side effects while replay is active.
- Added focused tests covering replay behavior and feedback-loop prevention.
