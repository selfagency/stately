---
# stately-ruuz
title: Persistence and history plugins
status: completed
type: epic
priority: critical
created_at: 2026-04-11T00:11:56Z
updated_at: 2026-04-11T04:14:42Z
parent: stately-pm7k
---

## Goal

Add opt-in persistence and history capabilities with serialization, adapters, undo/redo, and replay support.

## Todo

- [x] Build persistence plugin core and adapters.
- [x] Add compression support.
- [x] Implement history controller and time travel.
- [x] Add typed plugin options for persist/history.

## Summary of Changes

- Added persistence plugin core, storage adapters, and opt-in LZ compression.
- Added history recording, undo/redo, explicit batch grouping, and time-travel replay.
- Suppressed persistence and sync feedback loops during replay mode.
- Added typed plugin options and public exports for the new plugin surfaces.
