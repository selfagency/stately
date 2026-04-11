---
# stately-oa1j
title: Add async plugin and tracked action wrapper
status: todo
type: task
priority: critical
created_at: 2026-04-11T00:13:38Z
updated_at: 2026-04-11T00:14:08Z
parent: stately-2rnr
blocked_by:
  - stately-d5b6
---

## Todo

- [ ] Create `src/lib/async/plugin.svelte.ts`.
- [ ] Create `src/lib/async/track-async-action.svelte.ts`.
- [ ] Expose `isLoading`, `error`, `lastSuccessAt`, `lastFailureAt`, and `abort` state per tracked action.
- [ ] Ensure sync and failure hooks integrate with `$onAction()` semantics.
