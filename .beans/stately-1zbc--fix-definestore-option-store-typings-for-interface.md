---
# stately-1zbc
title: 'Fix defineStore option-store typings for interface state'
status: in-progress
type: bug
priority: high
created_at: 2026-04-13T14:48:45Z
updated_at: 2026-04-13T14:48:45Z
branch: fix/1zbc-define-store-interface-state
---

## Todo

- [x] Confirm the consumer-facing TypeScript failure and identify the root cause.
- [ ] Add regression coverage for option stores whose `state()` returns interface-typed objects.
- [ ] Update the public typings so option stores accept object/interface state without requiring `Record<string, unknown>` casts.
- [ ] Run targeted validation for the typing fix.
- [ ] Document the consumer workaround and final resolution.
