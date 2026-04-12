---
# stately-qvh7
title: Implement sync and async review remediations
status: completed
type: bug
priority: high
created_at: 2026-04-12T16:49:55Z
updated_at: 2026-04-12T16:58:46Z
---

## Todo

- [x] Add regression tests for sync ordering and duplicate delivery
- [x] Tighten or document sync conflict semantics
- [x] Add regression tests for async tracking contract
- [x] Implement or document async tracking behavior
- [x] Update docs and examples as needed
- [x] Run full validation

## Context

Address the remaining review findings around sync conflict handling and async action tracking after the lifecycle slice.

## Summary of Changes

- added regression coverage for cross-origin sync ordering, duplicate transport delivery, deterministic timestamp tie-breaking, and explicit async include tracking
- updated the sync plugin to reject stale cross-origin updates with timestamp-based ordering while keeping per-origin mutation id replay protection
- added bounded origin bookkeeping to keep sync duplicate suppression from growing without limit
- updated the async plugin so `include` can explicitly opt promise-returning actions into `$async` tracking even when they are not declared with `async`
- documented the new sync conflict semantics and async include behavior in the public reference docs
- validated the slice with `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`
