---
# stately-sp93
title: Implement sync transports
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:30Z
updated_at: 2026-04-11T03:18:01Z
parent: stately-40yg
blocked_by:
    - stately-6385
---

## Todo

- [x] Create `src/lib/sync/plugin.svelte.ts`.
- [x] Create `src/lib/sync/broadcast-channel.ts` for primary cross-tab transport.
- [x] Create `src/lib/sync/storage-events.ts` as a fallback transport.
- [x] Add instance-origin filtering to ignore self-emitted events.

## Summary of Changes

- Added sync transport primitives for `BroadcastChannel` and storage-event fallback delivery.
- Added a sync plugin that publishes store state snapshots and applies inbound messages for matching stores.
- Filtered self-originated events and ensured store disposal tears down transport subscriptions.
- Added targeted tests for transport filtering and plugin snapshot application.
