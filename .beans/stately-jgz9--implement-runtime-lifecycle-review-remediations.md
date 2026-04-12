---
# stately-jgz9
title: 'Implement runtime lifecycle review remediations'
status: in-progress
type: bug
priority: high
branch: fix/jgz9-runtime-lifecycle-remediations
created_at: 2026-04-12T16:29:43Z
updated_at: 2026-04-12T16:29:43Z
---

## Todo

- [ ] Add regression test for debounced persistence clear semantics
- [ ] Add regression test for `deleteStore()` disposal
- [ ] Fix persistence clear/dispose lifecycle behavior
- [ ] Fix `deleteStore()` teardown behavior
- [ ] Run targeted tests

## Context

Address the reviewed runtime lifecycle findings in persistence and state manager teardown first, before broader sync/async follow-up work.
