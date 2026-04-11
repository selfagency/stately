---
# stately-ep9j
title: Implement setup-store runtime
status: in-progress
type: task
priority: critical
created_at: 2026-04-11T00:13:00Z
updated_at: 2026-04-11T02:11:21Z
parent: stately-r76a
blocked_by:
    - stately-vcn2
---

## Todo
- [ ] Create `src/lib/runtime/create-setup-store.svelte.ts`.
- [ ] Classify returned members into state, getters, and actions.
- [ ] Guard against private/non-returned state breaking serialization or plugins.
- [ ] Verify method binding and exposed-member typing.
