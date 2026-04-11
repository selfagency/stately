---
# stately-pnt3
title: Validate inbound sync messages
status: in-progress
type: task
priority: high
created_at: 2026-04-11T00:13:30Z
updated_at: 2026-04-11T03:18:01Z
parent: stately-40yg
blocked_by:
    - stately-sp93
---

## Todo

- [ ] Create `src/lib/sync/message-schema.ts`.
- [ ] Validate store id, mutation id, version, payload shape, and timestamp fields.
- [ ] Reject malformed or incompatible remote payloads.
- [ ] Patch only after schema validation succeeds.
