---
# stately-doyt
title: Add abort and stale-result protection
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:38Z
updated_at: 2026-04-11T03:29:36Z
parent: stately-2rnr
blocked_by:
  - stately-xlto
---

## Todo

- [x] Create `src/lib/async/request-controller.ts`.
- [x] Use `AbortController` for cancellable action execution.
- [x] Track action-call tokens to prevent stale responses from overwriting new state.
- [x] Ensure cancellation updates loading/error metadata correctly.

## Summary of Changes

- Added `src/lib/async/request-controller.ts` for abortable request token management.
- Integrated `AbortController` and request-token tracking into tracked async actions.
- Prevented stale async completions from overwriting current metadata and state.
- Added targeted cancellation and stale-result tests covering direct aborts and restartable flows.
