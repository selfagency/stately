---
# stately-doyt
title: Add abort and stale-result protection
status: todo
type: task
priority: high
created_at: 2026-04-11T00:13:38Z
updated_at: 2026-04-11T00:14:08Z
parent: stately-2rnr
blocked_by:
  - stately-xlto
---

## Todo

- [ ] Create `src/lib/async/request-controller.ts`.
- [ ] Use `AbortController` for cancellable action execution.
- [ ] Track action-call tokens to prevent stale responses from overwriting new state.
- [ ] Ensure cancellation updates loading/error metadata correctly.
