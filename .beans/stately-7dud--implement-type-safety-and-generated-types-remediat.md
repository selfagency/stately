---
# stately-7dud
title: "Implement type-safety and generated-types remediations"
status: in-progress
type: feature
priority: high
created_at: 2026-04-12T18:58:25Z
updated_at: 2026-04-12T18:58:25Z
branch: feature/stately-7dud-type-safety-generated-types-remediations
---

## Goal

Implement the type-safety and generated-types remediation plan for the Stately library and inspector Vite plugin, starting with regression-first type tests and the highest-value public typing fixes.

## Todo

- [x] Add regression tests for public type flow across option stores, setup stores, plugins, and inspector/Vite entrypoints.
- [x] Tighten core store typing, especially selector/equality typing and avoidable broad object/function fallbacks.
- [x] Make persistence option exclusivity and payload boundaries more strongly typed.
- [x] Verify generated declaration output for root, inspector, and inspector/vite subpaths.
- [x] Update public docs for plugin typing and generated type expectations.
- [ ] Run check, lint, test, and build. *(check/test/build passed; lint is currently blocked by an existing ESLint flat-config compatibility issue in the repo config.)*

## Summary of Changes

- Added regression coverage for typed subscription selectors, typed validation/persistence options, and inspector Vite plugin virtual-module typing.
- Tightened `StoreSubscribeOptions` so `select` and `equalityFn` share the same selected value type.
- Made validation option augmentation type the `state` parameter from the actual store state.
- Made persistence `pick` and `omit` mutually exclusive at the type level while preserving runtime validation.
- Updated packaging so the published inspector Vite declaration carries the ambient `virtual:stately-inspector-options` typing.
- Updated public docs for typed subscription options, plugin authoring guidance, and inspector Vite type behavior.
