---
# stately-sp93
title: Implement sync transports
status: todo
type: task
priority: high
created_at: 2026-04-11T00:13:30Z
updated_at: 2026-04-11T00:14:08Z
parent: stately-40yg
blocked_by:
    - stately-6385
---

## Todo
- [ ] Create `src/lib/sync/plugin.svelte.ts`.
- [ ] Create `src/lib/sync/broadcast-channel.ts` for primary cross-tab transport.
- [ ] Create `src/lib/sync/storage-events.ts` as a fallback transport.
- [ ] Add instance-origin filtering to ignore self-emitted events.
