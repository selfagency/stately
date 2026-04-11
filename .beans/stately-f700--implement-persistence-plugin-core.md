---
# stately-f700
title: Implement persistence plugin core
status: todo
type: task
priority: critical
created_at: 2026-04-11T00:13:15Z
updated_at: 2026-04-11T00:14:08Z
parent: stately-8rtd
blocked_by:
  - stately-4ptl
---

## Todo

- [ ] Create `src/lib/persistence/types.ts` for persist config and adapter contracts.
- [ ] Create `src/lib/persistence/plugin.svelte.ts` for install-time store augmentation.
- [ ] Create `src/lib/persistence/serialize.ts` using `$state.snapshot()` and migration hooks.
- [ ] Validate versioned rehydration and safe deserialization behavior.
