---
# stately-4ptl
title: Add internal devtools timeline recorder
status: in-progress
type: task
priority: high
created_at: 2026-04-11T00:13:08Z
updated_at: 2026-04-11T02:29:36Z
parent: stately-thq4
blocked_by:
    - stately-d5b6
---

## Todo
- [ ] Create `src/lib/runtime/devtools-timeline.svelte.ts`.
- [ ] Record mutation and action events with labels, timestamps, and durations.
- [ ] Capture snapshots or patch metadata needed for later replay.
- [ ] Expose a read API suitable for the showcase debugger UI.
