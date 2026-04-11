---
goal: Svelte 5 Reactive State Library Implementation Plan
version: 1.1
date_created: 2026-04-10
last_updated: 2026-04-10
owner: GitHub Copilot
status: Planned
tags: [feature, architecture, svelte-5, state-management, pinia-like, library]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan defines the implementation of a Svelte 5 reactive state library inside the current Svelte library template. The library will provide a Pinia-inspired API while remaining aligned with Svelte 5 runes, request-safe usage in SvelteKit, and opt-in feature modules for persistence, history, synchronization, and async orchestration.

## 1. Requirements & Constraints

- **REQ-001**: Expose a Pinia-inspired public API centered on `defineStore()` and `use...Store()` semantics.
- **REQ-002**: Support both option-style stores (`state`, `getters`, `actions`) and setup-style stores (factory returning state, derived values, and actions).
- **REQ-003**: Expose store instance helpers equivalent in spirit to Pinia: `$id`, `$state`, `$patch`, `$reset`, `$subscribe`, `$onAction`, and `$dispose`.
- **REQ-004**: Implement persistence with adapters for `localStorage`, `sessionStorage`, IndexedDB, in-memory storage, and optional LZ-based compression.
- **REQ-005**: Implement history features: undo, redo, batch operations, and time-travel debugging snapshots.
- **REQ-006**: Implement synchronization features: multi-tab sync through `storage` events and `BroadcastChannel`.
- **REQ-007**: Implement async helpers that automatically track loading/error state, support request cancellation, and enforce configurable concurrency policies.
- **REQ-008**: Preserve strong TypeScript inference for store state, getters, actions, plugin-added properties, and configuration options.
- **REQ-009**: Keep the core runtime tree-shakable and make persistence/history/sync/async features opt-in.
- **REQ-010**: Provide a showcase page in the existing SvelteKit app demonstrating the API and all requested features.
- **REQ-011**: Add GitHub Actions CI workflows that validate pull requests and mainline changes with `check`, `lint`, `test`, `build`, and package-quality verification for the npm library.
- **REQ-012**: Add npm-library release automation for publishing the package with a documented versioning strategy and release workflow.
- **REQ-013**: Configure contributor quality gates with `husky`, `lint-staged`, `svelte-check`, and lint/format hooks aligned with the repository’s Biome and ESLint tooling.
- **REQ-014**: Create a VitePress documentation site that covers getting started, API usage, SSR-safe patterns, plugin features, and deployment.
- **SEC-001**: Prevent cross-request state leakage under SSR by avoiding shared mutable singleton state on the server by default.
- **SEC-002**: Serialize persisted state defensively; do not evaluate persisted payloads or trust browser storage contents.
- **SEC-003**: Ensure `BroadcastChannel` and `storage` event payloads are schema-validated before patching live state.
- **SSR-001**: The default recommended usage in SvelteKit must be request-scoped through a root state manager instance attached via context, not a top-level shared singleton.
- **SSR-002**: Any singleton convenience API must be explicitly documented as SPA-only.
- **CON-001**: The repository currently uses the default Svelte library template; new library source must live under `src/lib/` and the demo surface under `src/routes/+page.svelte`.
- **CON-002**: Internal modules that use `$state`, `$derived`, or `$effect` must be implemented in `.svelte.ts` files so the Svelte compiler can transform runes correctly.
- **CON-003**: Plain `.ts` files may be used only for runtime-agnostic helpers that do not require runes.
- **CON-004**: The implementation must remain compatible with the current package tooling defined in `package.json` (`svelte-package`, `svelte-check`, `vitest`, `eslint`).
- **CON-005**: CI workflows must live under `.github/workflows/` and use the repository’s package-manager and script conventions rather than custom ad hoc commands.
- **CON-006**: Contributor hooks must build on the existing `@biomejs/biome`, `husky`, and `lint-staged` devDependencies already present in `package.json`.
- **CON-007**: Documentation site source should live under `docs/` with VitePress configuration under `docs/.vitepress/` and must not displace library runtime code from `src/lib/`.
- **GUD-001**: Prefer `$derived` over `$effect` for computed state. Use `$effect` only for external side effects such as persistence, channels, or timers.
- **GUD-002**: Do not rely on destructuring reactive properties unless the API returns stable refs/wrappers designed for destructuring.
- **GUD-003**: Use `$state.snapshot()` for history entries and persistence serialization to avoid leaking proxies into external systems.
- **GUD-004**: Use `createSubscriber` from `svelte/reactivity` when bridging external event sources into reactive getters.
- **GUD-005**: Prefer package-manager scripts as the single source of truth for CI, hooks, and documentation builds so local automation and GitHub Actions stay aligned.
- **GUD-006**: Prefer incremental, fast pre-commit checks on staged files and reserve heavier workflows such as full tests or build validation for pre-push or CI.
- **PAT-001**: Separate the library into a minimal core plus feature plugins.
- **PAT-002**: Model Pinia plugin behavior with a root instance method like `createStateManager().use(plugin)` so plugins can augment stores and register hooks.
- **PAT-003**: Treat direct state mutation and `$patch()` as first-class flows, but route both through a unified mutation recorder so persistence, history, sync, and devtools timelines stay coherent.
- **PAT-004**: Provide store composition through normal imports, but document circular dependency limits and lazy resolution rules.
- **RSK-001**: Three requested sources returned HTTP 403 during research (`researchgate`, two `hashnode` pages); the plan therefore prioritizes the accessible authoritative Svelte/Pinia docs and the accessible community references.

## 2. Implementation Steps

<!-- markdownlint-disable MD060 -->

### Implementation Phase 1

- GOAL-001: Establish the core architecture, public API contracts, and SSR-safe root instance model.

| Task     | Description                                                                                              | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Scaffold `src/lib/root/*` for the root manager, plugin registry, lifecycle types, and SSR context.       |           |      |
| TASK-002 | Implement `src/lib/define-store.svelte.ts` for option and setup store definitions bound to a manager.    |           |      |
| TASK-003 | Add strict public typings in `src/lib/pinia-like/store-types.ts` for state, getters, actions, and hooks. |           |      |
| TASK-004 | Add `src/lib/pinia-like/store-to-refs.svelte.ts` for safe reactive destructuring of store members.       |           |      |
| TASK-005 | Update `src/lib/index.ts` to export only the stable public API and plugin factory entry points.          |           |      |

### Implementation Phase 2

- GOAL-002: Implement the store runtime for state, getters, actions, mutation batching, subscriptions, and disposal.

| Task     | Description                                                                                          | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-006 | Implement option-store instantiation in `src/lib/runtime/create-option-store.svelte.ts`.             |           |      |
| TASK-007 | Implement setup-store instantiation in `src/lib/runtime/create-setup-store.svelte.ts`.               |           |      |
| TASK-008 | Build `src/lib/runtime/store-shell.svelte.ts` for `$id`, `$state`, `$patch`, `$reset`, and disposal. |           |      |
| TASK-009 | Add `src/lib/runtime/mutation-queue.svelte.ts` for grouped commit batching and shared mutation flow. |           |      |
| TASK-010 | Add `src/lib/runtime/subscriptions.ts` for mutation subscriptions and action hook lifecycles.        |           |      |
| TASK-011 | Add `src/lib/runtime/devtools-timeline.svelte.ts` for mutation/action timeline recording.            |           |      |

### Implementation Phase 3

- GOAL-003: Add persistence and history as opt-in feature plugins with deterministic serialization and replay behavior.

| Task     | Description                                                                                                 | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-012 | Add `src/lib/persistence/*` for persist config, snapshot serialization, and rehydration rules.              |           |      |
| TASK-013 | Implement storage adapters for local, session, memory, and IndexedDB under `src/lib/persistence/adapters/`. |           |      |
| TASK-014 | Add opt-in LZ compression in `src/lib/persistence/compression/lz-string.ts`.                                |           |      |
| TASK-015 | Add `src/lib/history/plugin.svelte.ts` and `history-controller.svelte.ts` for undo/redo and batches.        |           |      |
| TASK-016 | Add `src/lib/history/time-travel.svelte.ts` for replaying timeline snapshots safely.                        |           |      |
| TASK-017 | Extend `src/lib/pinia-like/plugin-options.ts` with typed `persist` and `history` store options.             |           |      |

### Implementation Phase 4

- GOAL-004: Add cross-tab synchronization and async orchestration features without compromising SSR safety or store composability.

| Task     | Description                                                                                                                      | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-018 | Add `src/lib/sync/*` for `BroadcastChannel` transport and `storage` event fallback sync.                                         |           |      |
| TASK-019 | Add `src/lib/sync/message-schema.ts` for validating remote sync payloads before patching.                                        |           |      |
| TASK-020 | Add `src/lib/async/plugin.svelte.ts` and `track-async-action.svelte.ts` for loading/error state.                                 |           |      |
| TASK-021 | Implement concurrency policies in `src/lib/async/concurrency.ts` for `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe`. |           |      |
| TASK-022 | Add `src/lib/async/request-controller.ts` for `AbortController` support and stale-result guards.                                 |           |      |
| TASK-023 | Add `src/lib/async/external-subscribe.ts` using `createSubscriber` for external event bridges.                                   |           |      |

### Implementation Phase 5

- GOAL-005: Validate the library with a real demo, comprehensive tests, and documentation suitable for packaging and adoption.

| Task     | Description                                                                                                  | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-024 | Replace `src/routes/+page.svelte` with a showcase demonstrating persistence, history, sync, and async flows. |           |      |
| TASK-025 | Add unit tests under `src/lib/__tests__/` for core runtime, persistence, history, sync, and async features.  |           |      |
| TASK-026 | Add browser integration tests for the showcase in `src/routes/+page.svelte.spec.ts` or equivalent.           |           |      |
| TASK-027 | Update `README.md` with install, API, SSR-safe usage, plugins, examples, and Pinia mental-model docs.        |           |      |
| TASK-028 | Add packaged usage examples under `src/lib/examples/` for option/setup stores and each plugin area.          |           |      |
| TASK-029 | Verify `npm run check`, `npm run lint`, `npm run test`, and `npm run build` all pass.                        |           |      |

### Implementation Phase 6

- GOAL-006: Add CI/CD automation, contributor hooks, and a VitePress documentation site suitable for npm-library delivery.

| Task     | Description                                                                                                                                                          | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-030 | Add `.github/workflows/ci.yml` to run install, `pnpm run check`, `pnpm run lint`, `pnpm run test`, `pnpm run build`, and package smoke validation on PRs and pushes. |           |      |
| TASK-031 | Add `.github/workflows/release.yml` and versioning/publish automation for npm-library deployment, including provenance-friendly publish configuration.               |           |      |
| TASK-032 | Add release-management support files and docs (for example `.changeset/` config, publish metadata, and release instructions) so publishing is deterministic.         |           |      |
| TASK-033 | Configure `lint-staged` and `husky` pre-commit hooks for staged-file formatting and linting using Biome and ESLint.                                                  |           |      |
| TASK-034 | Configure `husky` pre-push validation for `svelte-check` and appropriate test coverage so local quality gates catch regressions before CI.                           |           |      |
| TASK-035 | Add `format`, `format:check`, and hook-aligned script entries in `package.json`, plus any required Biome or hook config files.                                       |           |      |
| TASK-036 | Scaffold a VitePress site under `docs/` with base config, theme navigation, sidebar structure, and initial landing pages.                                            |           |      |
| TASK-037 | Author VitePress content for installation, SSR-safe usage, `defineStore`, plugins, examples, testing, and migration guidance.                                        |           |      |
| TASK-038 | Add docs build/deploy automation, including CI integration and a documentation deployment workflow for the VitePress site.                                           |           |      |

<!-- markdownlint-enable MD060 -->

## 3. Alternatives

- **ALT-001**: Implement the library as wrappers around `svelte/store` rather than Svelte 5 runes. Rejected because the requested product is specifically a Svelte 5 reactive state library and the available docs recommend universal reactivity for Svelte 5-first designs.
- **ALT-002**: Export singleton `$state` values directly from modules and mutate them globally. Rejected because Svelte cannot safely reassign exported rune state across modules and because singleton mutable state is unsafe for SSR.
- **ALT-003**: Build only a global `reactive({})`-style API without a root manager instance. Rejected because Pinia parity requires plugin registration, SSR scoping, lifecycle control, and consistent outside-component usage.
- **ALT-004**: Reuse Nano Stores or another existing library internally. Rejected because the user asked for a new Svelte 5 library and the resulting API would either diverge from Pinia or duplicate two reactive systems.
- **ALT-005**: Make persistence/history/sync built into the core runtime. Rejected because opt-in plugins keep the base bundle smaller and match Pinia’s extension model better.
- **ALT-006**: Use `$effect` broadly for derived state and internal bookkeeping. Rejected because Svelte guidance recommends `$derived` for computation and reserving `$effect` for external side effects.

## 4. Dependencies

- **DEP-001**: `svelte` ^5.x already present in the template and required for runes, reactive built-ins, and `createSubscriber`.
- **DEP-002**: `@sveltejs/package` already present and required to package `.svelte.ts` library modules correctly.
- **DEP-003**: `vitest` and current browser test tooling already present and required for unit/component test coverage.
- **DEP-004**: Add `lz-string` for opt-in compressed persistence payloads.
- **DEP-005**: Add `idb-keyval` or implement an equivalent thin IndexedDB adapter directly. Preferred choice for execution: `idb-keyval` to avoid error-prone raw IndexedDB boilerplate.
- **DEP-006**: Browser APIs `localStorage`, `sessionStorage`, `BroadcastChannel`, `AbortController`, and `storage` events must be feature-detected and guarded for SSR.
- **DEP-007**: Add `vitepress` for the documentation site build, local preview, and deployable static output.
- **DEP-008**: Add a release-management tool such as `@changesets/cli` to support repeatable npm-library versioning and publish workflows.
- **DEP-009**: GitHub Actions workflows will depend on repository secrets or trusted publishing configuration for npm deployment.

## 5. Files

- **FILE-001**: `src/lib/index.ts` — public package entry.
- **FILE-002**: `src/lib/root/create-state-manager.ts` — root manager instance and plugin registry.
- **FILE-003**: `src/lib/root/state-manager-context.ts` — Svelte context helpers for SSR-safe request scoping.
- **FILE-004**: `src/lib/root/types.ts` — root-level interfaces and shared types.
- **FILE-005**: `src/lib/define-store.svelte.ts` — public `defineStore()` implementation.
- **FILE-006**: `src/lib/pinia-like/store-types.ts` — core store generics and public typings.
- **FILE-007**: `src/lib/pinia-like/store-to-refs.svelte.ts` — safe destructuring helper.
- **FILE-008**: `src/lib/pinia-like/plugin-options.ts` — typed custom options for persistence/history/sync/async plugins.
- **FILE-009**: `src/lib/runtime/create-option-store.svelte.ts` — option-store instantiation logic.
- **FILE-010**: `src/lib/runtime/create-setup-store.svelte.ts` — setup-store instantiation logic.
- **FILE-011**: `src/lib/runtime/store-shell.svelte.ts` — shared store instance helpers and metadata.
- **FILE-012**: `src/lib/runtime/mutation-queue.svelte.ts` — grouped mutation commit pipeline.
- **FILE-013**: `src/lib/runtime/subscriptions.ts` — store/action subscription management.
- **FILE-014**: `src/lib/runtime/devtools-timeline.svelte.ts` — mutation/action timeline recorder.
- **FILE-015**: `src/lib/persistence/plugin.svelte.ts` — persistence plugin entry.
- **FILE-016**: `src/lib/persistence/types.ts` — persistence config and adapter types.
- **FILE-017**: `src/lib/persistence/serialize.ts` — serialization, migration, and validation helpers.
- **FILE-018**: `src/lib/persistence/adapters/local-storage.ts` — `localStorage` adapter.
- **FILE-019**: `src/lib/persistence/adapters/session-storage.ts` — `sessionStorage` adapter.
- **FILE-020**: `src/lib/persistence/adapters/memory-storage.ts` — in-memory adapter.
- **FILE-021**: `src/lib/persistence/adapters/indexeddb.ts` — IndexedDB adapter.
- **FILE-022**: `src/lib/persistence/compression/lz-string.ts` — compression adapter.
- **FILE-023**: `src/lib/history/plugin.svelte.ts` — history plugin entry.
- **FILE-024**: `src/lib/history/history-controller.svelte.ts` — undo/redo/batch controller.
- **FILE-025**: `src/lib/history/time-travel.svelte.ts` — snapshot replay and time-travel.
- **FILE-026**: `src/lib/sync/plugin.svelte.ts` — sync plugin entry.
- **FILE-027**: `src/lib/sync/broadcast-channel.ts` — `BroadcastChannel` transport.
- **FILE-028**: `src/lib/sync/storage-events.ts` — storage-event transport fallback.
- **FILE-029**: `src/lib/sync/message-schema.ts` — payload validation helpers.
- **FILE-030**: `src/lib/async/plugin.svelte.ts` — async plugin entry.
- **FILE-031**: `src/lib/async/track-async-action.svelte.ts` — loading/error wrapper logic.
- **FILE-032**: `src/lib/async/concurrency.ts` — concurrency policy engine.
- **FILE-033**: `src/lib/async/request-controller.ts` — abort token and stale-result protection.
- **FILE-034**: `src/lib/async/external-subscribe.ts` — `createSubscriber` bridge utilities.
- **FILE-035**: `src/routes/+page.svelte` — interactive demo/showcase.
- **FILE-036**: `src/lib/examples/` — usage examples for packaged consumers.
- **FILE-037**: `src/lib/__tests__/define-store.spec.ts` — public API coverage.
- **FILE-038**: `src/lib/__tests__/patching.spec.ts` — mutation semantics coverage.
- **FILE-039**: `src/lib/__tests__/history.spec.ts` — undo/redo/time-travel coverage.
- **FILE-040**: `src/lib/__tests__/persistence.spec.ts` — adapter and migration coverage.
- **FILE-041**: `src/lib/__tests__/sync.spec.ts` — multi-tab sync coverage.
- **FILE-042**: `src/lib/__tests__/async.spec.ts` — cancellation and concurrency coverage.
- **FILE-043**: `src/routes/+page.svelte.spec.ts` or `src/lib/__tests__/showcase.spec.ts` — UI behavior coverage.
- **FILE-044**: `README.md` — end-user documentation.
- **FILE-045**: `.github/workflows/ci.yml` — pull-request and branch validation workflow.
- **FILE-046**: `.github/workflows/release.yml` — npm-library publish workflow.
- **FILE-047**: `.github/workflows/docs.yml` — VitePress documentation build/deploy workflow.
- **FILE-048**: `.changeset/` — release management and versioning configuration.
- **FILE-049**: `.husky/pre-commit` — staged-file validation hook.
- **FILE-050**: `.husky/pre-push` — local pre-push validation hook.
- **FILE-051**: `.lintstagedrc.*` or `package.json` lint-staged config — staged-file task definitions.
- **FILE-052**: `biome.json` or equivalent Biome config surface — formatting and check configuration if not already defined elsewhere.
- **FILE-053**: `docs/.vitepress/config.ts` — VitePress site configuration.
- **FILE-054**: `docs/index.md` — documentation home page.
- **FILE-055**: `docs/guide/*.md` — getting started and usage guides.
- **FILE-056**: `docs/api/*.md` — API reference and feature docs.

## 6. Testing

- **TEST-001**: Verify `defineStore()` option-store instances expose state/getters/actions with correct typing and reactive updates.
- **TEST-002**: Verify setup-store instances expose returned reactive members, preserve method binding, and reject non-returned/private state from public serialization paths.
- **TEST-003**: Verify direct mutation and `$patch(object)` / `$patch(fn)` produce correct final state and single grouped subscription notifications where expected.
- **TEST-004**: Verify `$reset()` restores initial state for option stores and custom reset behavior for setup stores.
- **TEST-005**: Verify `$subscribe()` receives mutation metadata and respects detached cleanup semantics.
- **TEST-006**: Verify `$onAction()` emits `after` and `onError` hooks for sync and async actions.
- **TEST-007**: Verify `persist` writes snapshots to memory, localStorage, sessionStorage, and IndexedDB adapters and rehydrates correctly on store creation.
- **TEST-008**: Verify persisted-state migration and version mismatch handling.
- **TEST-009**: Verify compression round-trips losslessly for supported payloads.
- **TEST-010**: Verify undo/redo restore prior snapshots without corrupting active derived getters.
- **TEST-011**: Verify batch operations create a single history entry and a single sync broadcast.
- **TEST-012**: Verify time-travel replay can jump to an earlier snapshot and then resume normal mutations.
- **TEST-013**: Verify cross-tab sync ignores self-originated events and applies only valid remote payloads.
- **TEST-014**: Verify `BroadcastChannel` fallback behavior when the API is unavailable.
- **TEST-015**: Verify wrapped async actions expose loading/error state correctly on success, failure, abort, and restart.
- **TEST-016**: Verify concurrency modes `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe` behave deterministically.
- **TEST-017**: Verify stale async responses cannot overwrite newer committed state.
- **TEST-018**: Verify the showcase page demonstrates persistence, history, sync, and async behavior from the user’s perspective.
- **TEST-019**: Verify `npm run check`, `npm run lint`, `npm run test`, and `npm run build` all succeed after implementation.
- **TEST-020**: Verify the CI workflow executes the canonical package scripts and fails on type, lint, test, build, or package-quality regressions.
- **TEST-021**: Verify the npm release workflow can perform a safe dry-run or publish-ready validation using the selected versioning strategy.
- **TEST-022**: Verify `husky` and `lint-staged` hooks run the intended format/lint checks on staged files and the intended `svelte-check`/test validations before push.
- **TEST-023**: Verify the VitePress site builds successfully and the docs deployment workflow produces deployable static output.

## 7. Risks & Assumptions

- **RISK-001**: Implementing Pinia-like ergonomics on top of Svelte 5 runes may expose edge cases around destructuring, `this` binding, and module-boundary reactivity.
- **RISK-002**: Time-travel replay can accidentally trigger persistence or sync feedback loops unless replay mode suppresses plugin side effects selectively.
- **RISK-003**: IndexedDB hydration is asynchronous, which may complicate initial render semantics for stores expected to be synchronously available.
- **RISK-004**: Cross-tab sync conflicts can occur if two tabs patch the same store concurrently without a conflict policy beyond last-write-wins.
- **RISK-005**: Compression can increase CPU cost for frequently mutating stores; it should remain opt-in and likely be discouraged for hot-path stores.
- **RISK-006**: SSR-safe request scoping adds API complexity compared with SPA-only singleton usage.
- **RISK-007**: npm publish automation can fail or mispublish without correct versioning, provenance, or secret configuration.
- **RISK-008**: Aggressive local hooks can frustrate contributors if pre-commit checks are too slow or overlap badly with CI.
- **RISK-009**: VitePress content can drift from the actual library behavior if documentation updates are not kept coupled to public API changes.
- **ASSUMPTION-001**: The library will target modern browsers with `AbortController`; legacy fallback behavior is not required in the first release.
- **ASSUMPTION-002**: Last-write-wins is acceptable for the first synchronization release; CRDT-grade conflict resolution is out of scope.
- **ASSUMPTION-003**: A built-in devtools timeline API and showcase-based debugger are sufficient for “time-travel debugging” in v1; full browser-extension integration is not required initially.
- **ASSUMPTION-004**: The current Svelte package tooling supports packaging `.svelte.ts` source modules without additional build-system changes.

## 8. Related Specifications / Further Reading

- [SvelteKit state management](https://svelte.dev/docs/kit/state-management)
- [Svelte `$state`](https://svelte.dev/docs/svelte/$state)
- [Svelte `$derived`](https://svelte.dev/docs/svelte/$derived)
- [Svelte reactive built-ins and `createSubscriber`](https://svelte.dev/docs/svelte/svelte-reactivity)
- [Pinia introduction](https://pinia.vuejs.org/introduction.html)
- [Pinia core concepts](https://pinia.vuejs.org/core-concepts/)
- [Pinia plugins](https://pinia.vuejs.org/core-concepts/plugins.html)
- [Pinia SSR guide](https://pinia.vuejs.org/ssr/)
- [Nano Stores reference for atomic store and lazy mount ideas](https://github.com/nanostores/nanostores)
- [Mainmatter on global state in Svelte 5](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/)
- [Joy of Code on sharing state in Svelte 5](https://joyofcode.xyz/how-to-share-state-in-svelte-5)
- [James Yip on Svelte 5 reactivity traps](https://jamesy.dev/blog/svelte-5-states-avoiding-common-reactivity-traps)

## 9. Recommended Beans Hierarchy

<!-- markdownlint-disable MD007 MD010 -->

### 9.1 Review Outcome

- **REV-001**: The current plan is complete and technically coherent.
- **REV-002**: The strongest parts are the SSR constraints, Svelte 5 module-boundary rules, and plugin-first architecture.
- **REV-003**: The missing operational layer was a concrete bean hierarchy for execution tracking.
- **REV-004**: The hierarchy below maps every implementation-step task (`TASK-001` through `TASK-038`) into milestone, epic, feature, and task beans with detailed `## Todo` checklists.
- **REV-005**: This section is ready to be used as the source material for Beans creation.

### 9.2 Creation Notes

- **NOTE-001**: Create one top-level `milestone` bean first.
- **NOTE-002**: Create each `epic` as a child of the milestone.
- **NOTE-003**: Create each `feature` as a child of its epic.
- **NOTE-004**: Create each `task` as a child of its feature.
- **NOTE-005**: Use the `Depends on` field below to set blocking relationships when creating beans.
- **NOTE-006**: Each task body should include the exact `## Todo` checklist listed below.
- **NOTE-007**: Priorities use Beans-native values: `critical`, `high`, `normal`, `low`, `deferred`.

### 9.3 Milestone

#### MILESTONE-001 — Deliver Svelte 5 Reactive State Library v1

- **Type**: `milestone`
- **Priority**: `critical`
- **Depends on**: `none`
- **Maps to**: Implementation Phases 1–6
- **Suggested `## Todo`**:
  - [ ] Approve the implementation plan and bean hierarchy.
  - [ ] Create all child epics, features, and tasks.
  - [ ] Execute work in dependency order.
  - [ ] Verify runtime, showcase, docs, and packaging are complete.
  - [ ] Mark milestone completed only after `TASK-029` is complete.

### 9.4 Epics, Features, and Tasks

#### EPIC-001 — Core Architecture and Public API

- **Type**: `epic`
- **Priority**: `critical`
- **Parent**: `MILESTONE-001`
- **Depends on**: `none`
- **Maps to**: Implementation Phase 1

##### FEATURE-001 — Root Manager and Store Definition

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-001`
- **Depends on**: `none`
- **Maps to**: `TASK-001`, `TASK-002`

###### TASK-001 — Scaffold root manager and SSR context modules

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-001`
- **Depends on**: `none`
- **Maps to**: `TASK-001`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/root/create-state-manager.ts` with the root manager interface and lifecycle skeleton.
  - [ ] Create `src/lib/root/state-manager-context.ts` with Svelte context helpers for request-scoped access.
  - [ ] Create `src/lib/root/types.ts` for manager, plugin, and lifecycle contracts.
  - [ ] Document SPA-only versus SSR-safe manager usage in code-level type comments where needed.

###### TASK-002 — Implement `defineStore()` entry point

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-001`
- **Depends on**: `TASK-001`
- **Maps to**: `TASK-002`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/define-store.svelte.ts` supporting option-store signatures.
  - [ ] Add setup-store overloads and bind store definitions to a concrete manager instance.
  - [ ] Enforce unique store ids and consistent store registration semantics.
  - [ ] Add error messages for invalid definition shapes.

##### FEATURE-002 — Types, Ref Extraction, and Public Entry Exports

- **Type**: `feature`
- **Priority**: `high`
- **Parent**: `EPIC-001`
- **Depends on**: `FEATURE-001`
- **Maps to**: `TASK-003`, `TASK-004`, `TASK-005`

###### TASK-003 — Add core public typings

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-002`
- **Depends on**: `TASK-002`
- **Maps to**: `TASK-003`
- **Suggested `## Todo`**:
  - [ ] Define `StoreState`, `StoreGetters`, `StoreActions`, and `StoreDefinition` generics.
  - [ ] Define mutation and action hook context types.
  - [ ] Add plugin augmentation interfaces for future extension.
  - [ ] Verify strict TypeScript inference works for both option and setup stores.

###### TASK-004 — Add reactive `storeToRefs()` helper

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-002`
- **Depends on**: `TASK-003`
- **Maps to**: `TASK-004`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/pinia-like/store-to-refs.svelte.ts`.
  - [ ] Ensure extracted members stay reactive under Svelte 5 constraints.
  - [ ] Exclude action methods from ref extraction.
  - [ ] Add typings for state and getter extraction behavior.

###### TASK-005 — Publish stable package exports

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-002`
- **Depends on**: `TASK-003`, `TASK-004`
- **Maps to**: `TASK-005`
- **Suggested `## Todo`**:
  - [ ] Update `src/lib/index.ts` to export the stable core entry points.
  - [ ] Export plugin factory entry points without leaking unstable internals.
  - [ ] Verify the package entry shape matches the intended public API surface.

#### EPIC-002 — Store Runtime and Mutation Pipeline

- **Type**: `epic`
- **Priority**: `critical`
- **Parent**: `MILESTONE-001`
- **Depends on**: `EPIC-001`
- **Maps to**: Implementation Phase 2

##### FEATURE-003 — Option and Setup Store Instantiation

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-002`
- **Depends on**: `FEATURE-002`
- **Maps to**: `TASK-006`, `TASK-007`

###### TASK-006 — Implement option-store runtime

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-003`
- **Depends on**: `TASK-005`
- **Maps to**: `TASK-006`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/runtime/create-option-store.svelte.ts`.
  - [ ] Convert `state()` output into reactive store state.
  - [ ] Bind getters as derived accessors and actions as store-bound methods.
  - [ ] Verify direct property mutation flows through the runtime correctly.

###### TASK-007 — Implement setup-store runtime

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-003`
- **Depends on**: `TASK-006`
- **Maps to**: `TASK-007`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/runtime/create-setup-store.svelte.ts`.
  - [ ] Classify returned members into state, getters, and actions.
  - [ ] Guard against private/non-returned state breaking serialization or plugins.
  - [ ] Verify method binding and exposed-member typing.

##### FEATURE-004 — Store Shell and Commit Batching

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-002`
- **Depends on**: `FEATURE-003`
- **Maps to**: `TASK-008`, `TASK-009`

###### TASK-008 — Implement store shell helpers

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-004`
- **Depends on**: `TASK-007`
- **Maps to**: `TASK-008`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/runtime/store-shell.svelte.ts`.
  - [ ] Implement `$id`, `$state`, `$patch`, `$reset`, `$subscribe`, `$onAction`, and `$dispose`.
  - [ ] Ensure all state changes route through a common mutation hook.
  - [ ] Add safe reset behavior for option and setup stores.

###### TASK-009 — Add grouped mutation queue

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-004`
- **Depends on**: `TASK-008`
- **Maps to**: `TASK-009`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/runtime/mutation-queue.svelte.ts`.
  - [ ] Group synchronous patch-function mutations into one logical commit.
  - [ ] Expose commit metadata for history, persistence, and sync integrations.
  - [ ] Verify nested or chained mutation scenarios behave deterministically.

##### FEATURE-005 — Subscriptions and Timeline Recording

- **Type**: `feature`
- **Priority**: `high`
- **Parent**: `EPIC-002`
- **Depends on**: `FEATURE-004`
- **Maps to**: `TASK-010`, `TASK-011`

###### TASK-010 — Implement state and action subscription lifecycles

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-005`
- **Depends on**: `TASK-009`
- **Maps to**: `TASK-010`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/runtime/subscriptions.ts`.
  - [ ] Implement mutation subscription callbacks and detached subscription behavior.
  - [ ] Implement action hooks with `after` and `onError` callbacks.
  - [ ] Ensure cleanup works inside and outside components.

###### TASK-011 — Add internal devtools timeline recorder

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-005`
- **Depends on**: `TASK-010`
- **Maps to**: `TASK-011`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/runtime/devtools-timeline.svelte.ts`.
  - [ ] Record mutation and action events with labels, timestamps, and durations.
  - [ ] Capture snapshots or patch metadata needed for later replay.
  - [ ] Expose a read API suitable for the showcase debugger UI.

#### EPIC-003 — Persistence and History Plugins

- **Type**: `epic`
- **Priority**: `critical`
- **Parent**: `MILESTONE-001`
- **Depends on**: `EPIC-002`
- **Maps to**: Implementation Phase 3

##### FEATURE-006 — Persistence Core and Adapters

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-003`
- **Depends on**: `FEATURE-005`
- **Maps to**: `TASK-012`, `TASK-013`, `TASK-014`

###### TASK-012 — Implement persistence plugin core

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-006`
- **Depends on**: `TASK-011`
- **Maps to**: `TASK-012`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/persistence/types.ts` for persist config and adapter contracts.
  - [ ] Create `src/lib/persistence/plugin.svelte.ts` for install-time store augmentation.
  - [ ] Create `src/lib/persistence/serialize.ts` using `$state.snapshot()` and migration hooks.
  - [ ] Validate versioned rehydration and safe deserialization behavior.

###### TASK-013 — Implement storage adapters

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-006`
- **Depends on**: `TASK-012`
- **Maps to**: `TASK-013`
- **Suggested `## Todo`**:
  - [ ] Add localStorage adapter.
  - [ ] Add sessionStorage adapter.
  - [ ] Add in-memory adapter.
  - [ ] Add IndexedDB adapter with async get/set/remove/clear/keys operations.

###### TASK-014 — Add opt-in LZ compression

- **Type**: `task`
- **Priority**: `normal`
- **Parent**: `FEATURE-006`
- **Depends on**: `TASK-013`
- **Maps to**: `TASK-014`
- **Suggested `## Todo`**:
  - [ ] Add `lz-string` integration under `src/lib/persistence/compression/lz-string.ts`.
  - [ ] Wire compression as an opt-in persist option.
  - [ ] Verify compressed payloads round-trip correctly.
  - [ ] Reject unsupported or invalid compressed input safely.

##### FEATURE-007 — Undo, Redo, and Time Travel

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-003`
- **Depends on**: `FEATURE-006`
- **Maps to**: `TASK-015`, `TASK-016`

###### TASK-015 — Implement history controller

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-007`
- **Depends on**: `TASK-009`, `TASK-012`
- **Maps to**: `TASK-015`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/history/plugin.svelte.ts`.
  - [ ] Create `src/lib/history/history-controller.svelte.ts`.
  - [ ] Implement `undo`, `redo`, `canUndo`, `canRedo`, and bounded history retention.
  - [ ] Support explicit batch start/end grouping.

###### TASK-016 — Implement time-travel replay

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-007`
- **Depends on**: `TASK-015`
- **Maps to**: `TASK-016`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/history/time-travel.svelte.ts`.
  - [ ] Replay historical snapshots through the same mutation pipeline as normal updates.
  - [ ] Prevent persistence and sync feedback loops during replay mode.
  - [ ] Expose replay metadata for the showcase debugger.

##### FEATURE-008 — Plugin Option Typing for Persist and History

- **Type**: `feature`
- **Priority**: `normal`
- **Parent**: `EPIC-003`
- **Depends on**: `FEATURE-007`
- **Maps to**: `TASK-017`

###### TASK-017 — Add typed plugin options

- **Type**: `task`
- **Priority**: `normal`
- **Parent**: `FEATURE-008`
- **Depends on**: `TASK-012`, `TASK-015`
- **Maps to**: `TASK-017`
- **Suggested `## Todo`**:
  - [ ] Extend `src/lib/pinia-like/plugin-options.ts` with `persist` config types.
  - [ ] Extend the same module with `history` config types.
  - [ ] Ensure both option-store and setup-store definitions accept the new options.

#### EPIC-004 — Sync and Async Orchestration

- **Type**: `epic`
- **Priority**: `critical`
- **Parent**: `MILESTONE-001`
- **Depends on**: `EPIC-003`
- **Maps to**: Implementation Phase 4

##### FEATURE-009 — Multi-Tab Sync Transport and Validation

- **Type**: `feature`
- **Priority**: `high`
- **Parent**: `EPIC-004`
- **Depends on**: `FEATURE-007`
- **Maps to**: `TASK-018`, `TASK-019`

###### TASK-018 — Implement sync transports

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-009`
- **Depends on**: `TASK-016`
- **Maps to**: `TASK-018`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/sync/plugin.svelte.ts`.
  - [ ] Create `src/lib/sync/broadcast-channel.ts` for primary cross-tab transport.
  - [ ] Create `src/lib/sync/storage-events.ts` as a fallback transport.
  - [ ] Add instance-origin filtering to ignore self-emitted events.

###### TASK-019 — Validate inbound sync messages

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-009`
- **Depends on**: `TASK-018`
- **Maps to**: `TASK-019`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/sync/message-schema.ts`.
  - [ ] Validate store id, mutation id, version, payload shape, and timestamp fields.
  - [ ] Reject malformed or incompatible remote payloads.
  - [ ] Patch only after schema validation succeeds.

##### FEATURE-010 — Async Action Tracking and Concurrency Control

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-004`
- **Depends on**: `FEATURE-009`
- **Maps to**: `TASK-020`, `TASK-021`, `TASK-022`, `TASK-023`

###### TASK-020 — Add async plugin and tracked action wrapper

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-010`
- **Depends on**: `TASK-010`
- **Maps to**: `TASK-020`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/async/plugin.svelte.ts`.
  - [ ] Create `src/lib/async/track-async-action.svelte.ts`.
  - [ ] Expose `isLoading`, `error`, `lastSuccessAt`, `lastFailureAt`, and `abort` state per tracked action.
  - [ ] Ensure sync and failure hooks integrate with `$onAction()` semantics.

###### TASK-021 — Implement concurrency policy engine

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-010`
- **Depends on**: `TASK-020`
- **Maps to**: `TASK-021`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/async/concurrency.ts`.
  - [ ] Implement `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe` modes.
  - [ ] Bind policy selection to per-action async options.
  - [ ] Verify deterministic behavior when actions are called rapidly.

###### TASK-022 — Add abort and stale-result protection

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-010`
- **Depends on**: `TASK-021`
- **Maps to**: `TASK-022`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/async/request-controller.ts`.
  - [ ] Use `AbortController` for cancellable action execution.
  - [ ] Track action-call tokens to prevent stale responses from overwriting new state.
  - [ ] Ensure cancellation updates loading/error metadata correctly.

###### TASK-023 — Bridge external event systems into reactivity

- **Type**: `task`
- **Priority**: `normal`
- **Parent**: `FEATURE-010`
- **Depends on**: `TASK-022`
- **Maps to**: `TASK-023`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/async/external-subscribe.ts`.
  - [ ] Use `createSubscriber` for browser or network event integrations.
  - [ ] Provide a reusable pattern for future websocket or observer-backed stores.

#### EPIC-005 — Showcase, Testing, Documentation, and Release Readiness

- **Type**: `epic`
- **Priority**: `critical`
- **Parent**: `MILESTONE-001`
- **Depends on**: `EPIC-004`
- **Maps to**: Implementation Phase 5

##### FEATURE-011 — Showcase UI and Browser Validation

- **Type**: `feature`
- **Priority**: `high`
- **Parent**: `EPIC-005`
- **Depends on**: `FEATURE-010`
- **Maps to**: `TASK-024`, `TASK-026`

###### TASK-024 — Build the interactive showcase page

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-011`
- **Depends on**: `TASK-016`, `TASK-019`, `TASK-022`
- **Maps to**: `TASK-024`
- **Suggested `## Todo`**:
  - [ ] Replace `src/routes/+page.svelte` with a demo for core store usage.
  - [ ] Demonstrate persistence, undo/redo, time travel, multi-tab sync, and async cancellation.
  - [ ] Include SSR-safe manager wiring patterns in the showcase structure.
  - [ ] Make the demo suitable for both manual testing and package marketing.

###### TASK-026 — Add browser integration tests for showcase behavior

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-011`
- **Depends on**: `TASK-024`
- **Maps to**: `TASK-026`
- **Suggested `## Todo`**:
  - [ ] Create `src/routes/+page.svelte.spec.ts` or equivalent browser test file.
  - [ ] Validate showcase behavior from the user perspective.
  - [ ] Cover persistence, history, sync, and async UI flows without relying on internal implementation details.

##### FEATURE-012 — Unit Tests, Docs, and Packaged Examples

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-005`
- **Depends on**: `FEATURE-011`
- **Maps to**: `TASK-025`, `TASK-027`, `TASK-028`

###### TASK-025 — Add unit test coverage for the library runtime

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-012`
- **Depends on**: `TASK-023`
- **Maps to**: `TASK-025`
- **Suggested `## Todo`**:
  - [ ] Add `define-store.spec.ts` and `patching.spec.ts`.
  - [ ] Add `history.spec.ts` and `persistence.spec.ts`.
  - [ ] Add `sync.spec.ts` and `async.spec.ts`.
  - [ ] Verify plugin interactions and edge cases described in the main plan.

###### TASK-027 — Update README and migration guidance

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-012`
- **Depends on**: `TASK-024`, `TASK-025`
- **Maps to**: `TASK-027`
- **Suggested `## Todo`**:
  - [ ] Document installation and public API usage.
  - [ ] Document SPA-only and SSR-safe usage patterns separately.
  - [ ] Add plugin configuration examples.
  - [ ] Add a Pinia mental-model and migration section.

###### TASK-028 — Add packaged example source files

- **Type**: `task`
- **Priority**: `normal`
- **Parent**: `FEATURE-012`
- **Depends on**: `TASK-027`
- **Maps to**: `TASK-028`
- **Suggested `## Todo`**:
  - [ ] Create `src/lib/examples/option-store` examples.
  - [ ] Create `src/lib/examples/setup-store` examples.
  - [ ] Add persistence, history, sync, and async focused examples.
  - [ ] Ensure examples mirror the final public API exactly.

##### FEATURE-013 — Final Verification and Release Gate

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-005`
- **Depends on**: `FEATURE-012`
- **Maps to**: `TASK-029`

###### TASK-029 — Run final validation and fix release blockers

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-013`
- **Depends on**: `TASK-025`, `TASK-026`, `TASK-027`, `TASK-028`
- **Maps to**: `TASK-029`
- **Suggested `## Todo`**:
  - [ ] Run `npm run check` and fix type/runtime issues.
  - [ ] Run `npm run lint` and fix lint issues.
  - [ ] Run `npm run test` and fix unit/browser test failures.
  - [ ] Run `npm run build` and fix packaging/export issues.
  - [ ] Confirm the package is ready for release-quality review.

#### EPIC-006 — CI/CD, Contributor Hooks, and VitePress Documentation

- **Type**: `epic`
- **Priority**: `critical`
- **Parent**: `MILESTONE-001`
- **Depends on**: `EPIC-001`
- **Maps to**: Implementation Phase 6

##### FEATURE-014 — GitHub Actions CI and npm Release Automation

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-006`
- **Depends on**: `FEATURE-002`
- **Maps to**: `TASK-030`, `TASK-031`, `TASK-032`

###### TASK-030 — Add pull-request and mainline CI workflow

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-014`
- **Depends on**: `TASK-005`
- **Maps to**: `TASK-030`
- **Suggested `## Todo`**:
  - [ ] Create `.github/workflows/ci.yml`.
  - [ ] Run install plus `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` in CI.
  - [ ] Add package-quality verification such as `svelte-package`/`publint` validation through the existing scripts.
  - [ ] Ensure the workflow runs on pull requests and protected branches.

###### TASK-031 — Add npm publish and release workflow

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-014`
- **Depends on**: `TASK-030`
- **Maps to**: `TASK-031`
- **Suggested `## Todo`**:
  - [ ] Create `.github/workflows/release.yml` for npm-library publishing.
  - [ ] Define the publish trigger and versioning flow for releases.
  - [ ] Configure provenance-friendly publish settings and secret or trusted-publisher requirements.
  - [ ] Ensure release automation does not publish when validation fails.

###### TASK-032 — Add release management support files and docs

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-014`
- **Depends on**: `TASK-031`
- **Maps to**: `TASK-032`
- **Suggested `## Todo`**:
  - [ ] Add `.changeset/` or the chosen release-management configuration.
  - [ ] Update package publish metadata as needed for npm delivery.
  - [ ] Document the release flow for maintainers.
  - [ ] Validate that a dry-run release path is deterministic.

##### FEATURE-015 — Local Quality Gates with Husky and Lint-Staged

- **Type**: `feature`
- **Priority**: `high`
- **Parent**: `EPIC-006`
- **Depends on**: `FEATURE-014`
- **Maps to**: `TASK-033`, `TASK-034`, `TASK-035`

###### TASK-033 — Configure pre-commit staged-file hooks

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-015`
- **Depends on**: `TASK-030`
- **Maps to**: `TASK-033`
- **Suggested `## Todo`**:
  - [ ] Configure `lint-staged` patterns for staged file validation.
  - [ ] Add `.husky/pre-commit`.
  - [ ] Run Biome format/check and ESLint in the staged-file flow.
  - [ ] Keep pre-commit feedback fast enough for normal contributor use.

###### TASK-034 — Configure pre-push validation hooks

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-015`
- **Depends on**: `TASK-033`
- **Maps to**: `TASK-034`
- **Suggested `## Todo`**:
  - [ ] Add `.husky/pre-push`.
  - [ ] Run `svelte-check` before push.
  - [ ] Run the appropriate local test command before push.
  - [ ] Document the intended split between pre-commit, pre-push, and CI checks.

###### TASK-035 — Add format and automation-aligned scripts

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-015`
- **Depends on**: `TASK-033`, `TASK-034`
- **Maps to**: `TASK-035`
- **Suggested `## Todo`**:
  - [ ] Add `format` and `format:check` scripts to `package.json`.
  - [ ] Align hook commands with package-manager scripts so local and CI behavior match.
  - [ ] Add or refine Biome configuration if needed for formatting and checks.
  - [ ] Verify hooks and scripts do not conflict with ESLint or Svelte tooling.

##### FEATURE-016 — VitePress Documentation Site and Deployment

- **Type**: `feature`
- **Priority**: `critical`
- **Parent**: `EPIC-006`
- **Depends on**: `FEATURE-012`
- **Maps to**: `TASK-036`, `TASK-037`, `TASK-038`

###### TASK-036 — Scaffold the VitePress site

- **Type**: `task`
- **Priority**: `critical`
- **Parent**: `FEATURE-016`
- **Depends on**: `TASK-027`
- **Maps to**: `TASK-036`
- **Suggested `## Todo`**:
  - [ ] Add `docs/.vitepress/config.ts`.
  - [ ] Create the VitePress site structure under `docs/`.
  - [ ] Configure navigation, sidebar, and site metadata.
  - [ ] Add a docs landing page and primary guide entry points.

###### TASK-037 — Author VitePress documentation content

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-016`
- **Depends on**: `TASK-036`
- **Maps to**: `TASK-037`
- **Suggested `## Todo`**:
  - [ ] Document installation and package consumption as an npm library.
  - [ ] Document `defineStore`, option stores, and setup stores.
  - [ ] Document SSR-safe usage, plugins, persistence, history, sync, and async orchestration.
  - [ ] Add migration, testing, and troubleshooting guides.

###### TASK-038 — Add docs build and deployment automation

- **Type**: `task`
- **Priority**: `high`
- **Parent**: `FEATURE-016`
- **Depends on**: `TASK-036`, `TASK-037`
- **Maps to**: `TASK-038`
- **Suggested `## Todo`**:
  - [ ] Add a docs workflow under `.github/workflows/docs.yml`.
  - [ ] Integrate VitePress build validation into CI.
  - [ ] Configure deployment for the generated static docs site.
  - [ ] Verify docs deployment does not drift from the library release flow.

<!-- markdownlint-enable MD007 MD010 -->
