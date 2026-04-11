---
# stately-4ptl
title: Add internal devtools timeline recorder
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:08Z
updated_at: 2026-04-11T02:33:14Z
parent: stately-thq4
blocked_by:
  - stately-d5b6
---

## Todo

- [x] Create `src/lib/runtime/devtools-timeline.svelte.ts`.
- [x] Record mutation and action events with labels, timestamps, and durations.
- [x] Capture snapshots or patch metadata needed for later replay.
- [x] Expose a read API suitable for the showcase debugger UI.

## Summary of Changes

- Added `src/lib/runtime/devtools-timeline.svelte.ts` for internal mutation and action event recording.
- Recorded labels, timestamps, durations, payloads, results, and snapshots for timeline entries.
- Wired the store shell into the timeline recorder for mutation and action flows.
- Added a read API and targeted timeline tests suitable for future debugger/showcase usage.
