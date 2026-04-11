---
# stately-40yg
title: Multi-tab sync transport and validation
status: completed
type: feature
priority: high
created_at: 2026-04-11T00:12:33Z
updated_at: 2026-04-11T03:19:40Z
parent: stately-uu8l
---

## Goal

Implement cross-tab synchronization with validation and self-event filtering.

## Todo

- [x] Implement BroadcastChannel and storage-event transports.
- [x] Validate inbound sync payloads before patching.

## Summary of Changes

- Added `BroadcastChannel` and storage-event sync transport modules with self-origin filtering.
- Added a sync plugin that publishes snapshots and applies validated remote state updates.
- Added a sync message schema and integrated validation before patching live store state.
