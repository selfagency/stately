---
# stately-coym
title: Remediate history and time-travel state typing
status: completed
type: task
priority: high
created_at: 2026-04-13T15:11:13Z
updated_at: 2026-04-13T15:36:28Z
---

## Todo

- [x] Address follow-up review notes from the option-store typing fix before continuing the history slice.
- [x] Add failing type-focused coverage for history/time-travel state preservation.
- [x] Update history/time-travel public types to preserve concrete state.
- [x] Update history plugin typing and snapshots to stop erasing state.
- [x] Update validation plugin typing to preserve concrete state in callbacks and wrapped patches.
- [x] Update persistence and sync public typings/helpers to preserve concrete state through public hooks and messages.
- [x] Update FSM/runtime helper typing where state precision is still unnecessarily erased.
- [x] Run focused validation for each slice and full repo validation at the end.
- [x] Summarize changes and any remaining intentionally-runtime-only record guards.

## Summary of Changes

- Made `StoreCustomProperties` and related plugin augmentation plumbing generic over concrete store state so plugins can preserve typed state instead of erasing it to `Record<string, unknown>`.
- Updated history/time-travel controllers and plugin augmentation to preserve concrete snapshot types through `$history` and `$timeTravel`, with new type-focused regression coverage.
- Updated validation, persistence, and sync public hooks/messages to preserve concrete state types in callbacks, envelopes, and typed sync messages.
- Reduced unnecessary internal state erasure in FSM patch/subscription helpers and `storeToRefs()`.
- Addressed carry-over review feedback by tightening option-store state checks and restoring `defineStore(...persist...)` exclusivity coverage.
- Verified the branch with `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`.
