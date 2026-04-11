---
# stately-f14e
title: Undo, redo, and time travel
status: completed
type: feature
priority: critical
created_at: 2026-04-11T00:12:29Z
updated_at: 2026-04-11T04:11:15Z
parent: stately-ruuz
---

## Goal

Implement history tracking, undo/redo, and timeline replay.

## Todo

- [x] Implement history controller.
- [x] Implement time-travel replay.

## Summary of Changes

- Added history recording with undo/redo, retention limits, and explicit batch grouping.
- Added replay support with debugger-friendly metadata.
- Prevented persistence and sync side effects during replay mode.
