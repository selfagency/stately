---
# stately-1zbc
title: Fix defineStore option-store typings for interface state
status: completed
type: bug
priority: high
created_at: 2026-04-13T14:48:45Z
updated_at: 2026-04-13T18:10:26Z
---

## Todo

- [x] Confirm the consumer-facing TypeScript failure and identify the root cause.
- [x] Add regression coverage for option stores whose `state()` returns interface-typed objects.
- [x] Update the public typings so option stores accept object/interface
      state without requiring `Record<string, unknown>` casts.
- [x] Run targeted validation for the typing fix.
- [x] Document the consumer workaround and final resolution.

## Summary of Changes

- Relaxed `defineStore()` option/setup store generic constraints from
  `Record<string, unknown>` to `object` so interface-typed state works in
  consumer projects.
- Added a regression test covering interface-typed option-store state with persistence enabled.
- Fixed option-store action/getter `this` typing so shell helpers like
  `$patch`, `$reset`, `$subscribe`, `$onAction`, `$dispose`, `set`, and
  `subscribe` remain available inside actions.
- Updated option-store generic plumbing in `defineStore()` and
  `createOptionStore()` to preserve the full inferred store instance without
  regressing existing option-store helpers.
- Verified the fix with focused define-store/store-types tests plus
  `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`.
