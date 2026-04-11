---
# stately-doyt
title: Add abort and stale-result protection
status: in-progress
type: task
priority: high
created_at: 2026-04-11T00:13:38Z
updated_at: 2026-04-11T03:26:54Z
parent: stately-2rnr
blocked_by:
    - stately-xlto
---

## Todo

- [ ] Create `src/lib/async/request-controller.ts`.
- [ ] Use `AbortController` for cancellable action execution.
- [ ] Track action-call tokens to prevent stale responses from overwriting new state.
- [ ] Ensure cancellation updates loading/error metadata correctly.
