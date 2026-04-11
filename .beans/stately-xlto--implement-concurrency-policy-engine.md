---
# stately-xlto
title: Implement concurrency policy engine
status: in-progress
type: task
priority: high
created_at: 2026-04-11T00:13:38Z
updated_at: 2026-04-11T03:22:27Z
parent: stately-2rnr
blocked_by:
    - stately-oa1j
---

## Todo

- [ ] Create `src/lib/async/concurrency.ts`.
- [ ] Implement `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe` modes.
- [ ] Bind policy selection to per-action async options.
- [ ] Verify deterministic behavior when actions are called rapidly.
