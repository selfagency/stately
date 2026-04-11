---
# stately-dh46
title: Implement store shell helpers
status: todo
type: task
priority: critical
created_at: 2026-04-11T00:13:04Z
updated_at: 2026-04-11T00:14:08Z
parent: stately-3rjd
blocked_by:
    - stately-ep9j
---

## Todo
- [ ] Create `src/lib/runtime/store-shell.svelte.ts`.
- [ ] Implement `$id`, `$state`, `$patch`, `$reset`, `$subscribe`, `$onAction`, and `$dispose`.
- [ ] Ensure all state changes route through a common mutation hook.
- [ ] Add safe reset behavior for option and setup stores.
