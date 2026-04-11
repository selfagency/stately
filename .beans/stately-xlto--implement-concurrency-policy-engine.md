---
# stately-xlto
title: Implement concurrency policy engine
status: completed
type: task
priority: high
created_at: 2026-04-11T00:13:38Z
updated_at: 2026-04-11T03:26:54Z
parent: stately-2rnr
blocked_by:
    - stately-oa1j
---

## Todo

- [x] Create `src/lib/async/concurrency.ts`.
- [x] Implement `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe` modes.
- [x] Bind policy selection to per-action async options.
- [x] Verify deterministic behavior when actions are called rapidly.

## Summary of Changes

- Added `src/lib/async/concurrency.ts` with `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe` policies.
- Bound concurrency mode selection into the tracked async action wrapper and async plugin options.
- Added targeted tests covering deterministic rapid-call behavior and plugin policy binding.
