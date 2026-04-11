---
# stately-6385
title: Implement time-travel replay
status: todo
type: task
priority: high
created_at: 2026-04-11T00:13:19Z
updated_at: 2026-04-11T00:14:08Z
parent: stately-f14e
blocked_by:
  - stately-ffo3
---

## Todo

- [ ] Create `src/lib/history/time-travel.svelte.ts`.
- [ ] Replay historical snapshots through the same mutation pipeline as normal updates.
- [ ] Prevent persistence and sync feedback loops during replay mode.
- [ ] Expose replay metadata for the showcase debugger.
