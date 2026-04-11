---
# stately-pnt3
title: Validate inbound sync messages
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:30Z
updated_at: 2026-04-11T03:19:40Z
parent: stately-40yg
blocked_by:
  - stately-sp93
---

## Todo

- [x] Create `src/lib/sync/message-schema.ts`.
- [x] Validate store id, mutation id, version, payload shape, and timestamp fields.
- [x] Reject malformed or incompatible remote payloads.
- [x] Patch only after schema validation succeeds.

## Summary of Changes

- Added `src/lib/sync/message-schema.ts` to validate inbound sync payloads.
- Enforced store id, mutation id, version, timestamp, origin, and state-shape checks.
- Updated the sync plugin to reject malformed or incompatible inbound messages.
- Added targeted schema and plugin tests covering successful parsing and invalid payload rejection.
