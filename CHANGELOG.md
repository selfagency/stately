# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed

- **Setup store `$state` and `$patch` now exclude action functions.** Previously,
  `$state` and `$patch()` on setup stores included action methods in their types.
  They now correctly expose only data properties, matching option store behavior.
- **Plugin factories return strongly typed `StateManagerPlugin`.** All built-in
  plugin factories (`createPersistencePlugin`, `createHistoryPlugin`,
  `createSyncPlugin`, `createAsyncPlugin`, `createFsmPlugin`) now return
  explicitly typed plugin values with proper augmentation generics, giving
  consumers better IntelliSense when chaining `.use()` calls.
- **Eliminated unsafe double-casts in persistence and FSM plugins.** Internal
  `as unknown as X` patterns replaced with constructed typed objects that
  use single-field assertions.

### Added

- **Compile-time type test suite.** A dedicated `types.test-d.ts` file with 30
  type-level tests using Vitest's `expectTypeOf` API, covering option stores,
  setup stores, plugin augmentation, `storeToRefs`, selective subscriptions,
  and compile-time rejection of invalid state shapes.

## [0.1.3] - 2026-04-13

## What's Changed

- fix: accept interface-typed option store state by @selfagency in <https://github.com/selfagency/stately/pull/22>
- fix: preserve concrete plugin state typing by @selfagency in <https://github.com/selfagency/stately/pull/23>

**Full Changelog**: <https://github.com/selfagency/stately/compare/v0.1.2...v0.1.3>

_Source: changes from v0.1.2 to v0.1.3._

## [0.1.2] - 2026-04-13

## What's Changed

- Implement core architecture and public API by @selfagency in <https://github.com/selfagency/stately/pull/1>
- Implement store runtime and mutation pipeline by @selfagency in <https://github.com/selfagency/stately/pull/2>
- Implement sync and async orchestration runtime by @selfagency in <https://github.com/selfagency/stately/pull/3>
- Reapply persistence and history plugins after accidental merge loss by @selfagency in <https://github.com/selfagency/stately/pull/5>
- Add showcase, docs, examples, and release readiness by @selfagency in <https://github.com/selfagency/stately/pull/6>
- feat: harden dist-first release packaging by @selfagency in <https://github.com/selfagency/stately/pull/7>
- fix: implement full remediation plan across runtime, persistence, sync, and async by @selfagency in <https://github.com/selfagency/stately/pull/8>
- fix: support class-based setup stores and harden payload handling by @selfagency in <https://github.com/selfagency/stately/pull/9>
- feat: add Stately inspector Vite plugin by @selfagency in <https://github.com/selfagency/stately/pull/10>
- fix: comprehensive code review remediations (security, correctness, tests, docs) by @selfagency in <https://github.com/selfagency/stately/pull/12>
- fix: harden runtime lifecycle, sync ordering, and async tracking by @selfagency in <https://github.com/selfagency/stately/pull/13>
- feat: adopt external state library patterns by @selfagency in <https://github.com/selfagency/stately/pull/14>
- feat(types): complete generated type remediations by @selfagency in <https://github.com/selfagency/stately/pull/15>
- docs: refresh documentation surface and remove regal conceit by @selfagency in <https://github.com/selfagency/stately/pull/16>
- fix: code review remediation plan (phases 1–6) by @selfagency in <https://github.com/selfagency/stately/pull/17>
- fix: route tag creation through GitHub Actions to bypass repo ruleset by @Copilot in <https://github.com/selfagency/stately/pull/18>
- chore(deps-dev): bump globals from 17.4.0 to 17.5.0 by @dependabot[bot] in <https://github.com/selfagency/stately/pull/19>
- chore(deps-dev): bump @typescript/native-preview from 7.0.0-dev.20260410.1 to 7.0.0-dev.20260413.1 by @dependabot[bot] in <https://github.com/selfagency/stately/pull/20>
- chore(deps-dev): bump vitest-browser-svelte from 2.1.0 to 2.1.1 by @dependabot[bot] in <https://github.com/selfagency/stately/pull/21>

## New Contributors

- @Copilot made their first contribution in <https://github.com/selfagency/stately/pull/18>
- @dependabot[bot] made their first contribution in <https://github.com/selfagency/stately/pull/19>

**Full Changelog**: <https://github.com/selfagency/stately/commits/v0.1.2>

## [0.1.0] - 2026-04-12

## What's Changed

- Implement core architecture and public API by @selfagency in <https://github.com/selfagency/stately/pull/1>
- Implement store runtime and mutation pipeline by @selfagency in <https://github.com/selfagency/stately/pull/2>
- Implement sync and async orchestration runtime by @selfagency in <https://github.com/selfagency/stately/pull/3>
- Reapply persistence and history plugins after accidental merge loss by @selfagency in <https://github.com/selfagency/stately/pull/5>
- Add showcase, docs, examples, and release readiness by @selfagency in <https://github.com/selfagency/stately/pull/6>
- feat: harden dist-first release packaging by @selfagency in <https://github.com/selfagency/stately/pull/7>
- fix: implement full remediation plan across runtime, persistence, sync, and async by @selfagency in <https://github.com/selfagency/stately/pull/8>
- fix: support class-based setup stores and harden payload handling by @selfagency in <https://github.com/selfagency/stately/pull/9>
- feat: add Stately inspector Vite plugin by @selfagency in <https://github.com/selfagency/stately/pull/10>
- fix: comprehensive code review remediations (security, correctness, tests, docs) by @selfagency in <https://github.com/selfagency/stately/pull/12>
- fix: harden runtime lifecycle, sync ordering, and async tracking by @selfagency in <https://github.com/selfagency/stately/pull/13>
- feat: adopt external state library patterns by @selfagency in <https://github.com/selfagency/stately/pull/14>
- feat(types): complete generated type remediations by @selfagency in <https://github.com/selfagency/stately/pull/15>
- docs: refresh documentation surface and remove regal conceit by @selfagency in <https://github.com/selfagency/stately/pull/16>
- fix: code review remediation plan (phases 1–6) by @selfagency in <https://github.com/selfagency/stately/pull/17>

**Full Changelog**: <https://github.com/selfagency/stately/commits/v0.1.0>

## [0.1.1] - 2026-04-12

## What's Changed

- Implement core architecture and public API by @selfagency in <https://github.com/selfagency/stately/pull/1>
- Implement store runtime and mutation pipeline by @selfagency in <https://github.com/selfagency/stately/pull/2>
- Implement sync and async orchestration runtime by @selfagency in <https://github.com/selfagency/stately/pull/3>
- Reapply persistence and history plugins after accidental merge loss by @selfagency in <https://github.com/selfagency/stately/pull/5>
- Add showcase, docs, examples, and release readiness by @selfagency in <https://github.com/selfagency/stately/pull/6>
- feat: harden dist-first release packaging by @selfagency in <https://github.com/selfagency/stately/pull/7>
- fix: implement full remediation plan across runtime, persistence, sync, and async by @selfagency in <https://github.com/selfagency/stately/pull/8>
- fix: support class-based setup stores and harden payload handling by @selfagency in <https://github.com/selfagency/stately/pull/9>
- feat: add Stately inspector Vite plugin by @selfagency in <https://github.com/selfagency/stately/pull/10>
- fix: comprehensive code review remediations (security, correctness, tests, docs) by @selfagency in <https://github.com/selfagency/stately/pull/12>
- fix: harden runtime lifecycle, sync ordering, and async tracking by @selfagency in <https://github.com/selfagency/stately/pull/13>
- feat: adopt external state library patterns by @selfagency in <https://github.com/selfagency/stately/pull/14>
- feat(types): complete generated type remediations by @selfagency in <https://github.com/selfagency/stately/pull/15>
- docs: refresh documentation surface and remove regal conceit by @selfagency in <https://github.com/selfagency/stately/pull/16>
- fix: code review remediation plan (phases 1–6) by @selfagency in <https://github.com/selfagency/stately/pull/17>

**Full Changelog**: <https://github.com/selfagency/stately/commits/v0.1.1>
