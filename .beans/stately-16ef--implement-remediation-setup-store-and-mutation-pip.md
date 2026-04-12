---
# stately-16ef
title: Implement remediation setup-store and mutation pipeline fixes
status: completed
type: task
priority: high
created_at: 2026-04-11T18:22:02Z
updated_at: 2026-04-12T15:37:21Z
---

## Goal

Implement the reviewed remediation work, starting with failing regression tests and fixing core correctness issues around setup-store semantics and mutation notifications.

## Todo

- [ ] Add failing regression tests for setup-store accessor/closure state with helpers/plugins
- [ ] Add failing regression tests for deep direct mutations (`array.push`, nested writes) and `$subscribe` side-effects
- [ ] Fix setup-store runtime behavior to preserve helper/plugin semantics
- [ ] Fix deep mutation notification path (or enforce explicit mutation constraints)
- [ ] Fix release workflow CI gate workflow-name mismatch
- [ ] Update docs/examples to match supported setup-store semantics
- [ ] Run `pnpm run check`, `pnpm run lint`, `pnpm run test`, `pnpm run build`

## Summary of Changes

- Pending
