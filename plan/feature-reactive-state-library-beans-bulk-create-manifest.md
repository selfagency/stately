---
title: Beans Bulk Create Manifest — Svelte 5 Reactive State Library
created: 2026-04-10
source_plan: ./feature-reactive-state-library-1.md
status: ready-for-manual-or-mcp-creation
---

## Beans Bulk Create Manifest

This manifest is optimized for staged creation with a bulk-create workflow.

## How to use

1. Create batches in order.
2. After each batch, map the returned real bean IDs to the symbolic `ref` values in this file.
3. Use the mapped parent ID for the next batch.
4. After all beans are created, apply blocking relationships in a follow-up update pass.

## ID mapping sheet

Fill this in as beans are created.

| Ref                              | Real Bean ID |
| -------------------------------- | ------------ |
| `milestone-v1`                   |              |
| `epic-core-api`                  |              |
| `epic-runtime`                   |              |
| `epic-persistence-history`       |              |
| `epic-sync-async`                |              |
| `epic-showcase-docs`             |              |
| `epic-ci-docs`                   |              |
| `feature-root-define-store`      |              |
| `feature-types-exports`          |              |
| `feature-store-instantiation`    |              |
| `feature-store-shell`            |              |
| `feature-subscriptions-timeline` |              |
| `feature-persistence`            |              |
| `feature-history`                |              |
| `feature-plugin-options`         |              |
| `feature-sync`                   |              |
| `feature-async`                  |              |
| `feature-showcase`               |              |
| `feature-tests-docs`             |              |
| `feature-release-gate`           |              |
| `feature-ci-release`             |              |
| `feature-dev-hooks`              |              |
| `feature-vitepress-docs`         |              |
| `task-001`                       |              |
| `task-002`                       |              |
| `task-003`                       |              |
| `task-004`                       |              |
| `task-005`                       |              |
| `task-006`                       |              |
| `task-007`                       |              |
| `task-008`                       |              |
| `task-009`                       |              |
| `task-010`                       |              |
| `task-011`                       |              |
| `task-012`                       |              |
| `task-013`                       |              |
| `task-014`                       |              |
| `task-015`                       |              |
| `task-016`                       |              |
| `task-017`                       |              |
| `task-018`                       |              |
| `task-019`                       |              |
| `task-020`                       |              |
| `task-021`                       |              |
| `task-022`                       |              |
| `task-023`                       |              |
| `task-024`                       |              |
| `task-025`                       |              |
| `task-026`                       |              |
| `task-027`                       |              |
| `task-028`                       |              |
| `task-029`                       |              |
| `task-030`                       |              |
| `task-031`                       |              |
| `task-032`                       |              |
| `task-033`                       |              |
| `task-034`                       |              |
| `task-035`                       |              |
| `task-036`                       |              |
| `task-037`                       |              |
| `task-038`                       |              |

## Batch 1 — Milestone

```json
{
  "sharedParentRef": null,
  "items": [
    {
      "ref": "milestone-v1",
      "title": "Deliver Svelte 5 Reactive State Library v1",
      "type": "milestone",
      "priority": "critical",
      "body": "## Goal\nDeliver a production-ready Svelte 5 reactive state library with a Pinia-inspired API and opt-in plugins for persistence, history, sync, and async orchestration.\n\n## Todo\n- [ ] Approve the implementation plan and bean hierarchy.\n- [ ] Create all child epics, features, and tasks.\n- [ ] Execute work in dependency order.\n- [ ] Verify runtime, showcase, docs, and packaging are complete.\n- [ ] Mark milestone completed only after task-029 is complete."
    }
  ]
}
```

## Batch 2 — Epics under `milestone-v1`

```json
{
  "sharedParentRef": "milestone-v1",
  "items": [
    {
      "ref": "epic-core-api",
      "title": "Core architecture and public API",
      "type": "epic",
      "priority": "critical",
      "body": "## Goal\nEstablish the root manager architecture, `defineStore()` entry point, and stable public API surface.\n\n## Todo\n- [ ] Implement root manager and SSR context primitives.\n- [ ] Implement `defineStore()` for option and setup stores.\n- [ ] Add core typings, `storeToRefs()`, and stable exports."
    },
    {
      "ref": "epic-runtime",
      "title": "Store runtime and mutation pipeline",
      "type": "epic",
      "priority": "critical",
      "body": "## Goal\nBuild the runtime for state, getters, actions, batching, subscriptions, and timeline recording.\n\n## Todo\n- [ ] Implement option and setup store instantiation.\n- [ ] Implement store shell helpers and grouped commit batching.\n- [ ] Implement subscriptions and internal timeline recording."
    },
    {
      "ref": "epic-persistence-history",
      "title": "Persistence and history plugins",
      "type": "epic",
      "priority": "critical",
      "body": "## Goal\nAdd opt-in persistence and history capabilities with serialization, adapters, undo/redo, and replay support.\n\n## Todo\n- [ ] Build persistence plugin core and adapters.\n- [ ] Add compression support.\n- [ ] Implement history controller and time travel.\n- [ ] Add typed plugin options for persist/history."
    },
    {
      "ref": "epic-sync-async",
      "title": "Sync and async orchestration",
      "type": "epic",
      "priority": "critical",
      "body": "## Goal\nAdd cross-tab synchronization and async action orchestration with cancellation and concurrency control.\n\n## Todo\n- [ ] Implement sync transports and message validation.\n- [ ] Implement async action tracking.\n- [ ] Implement concurrency policies and request cancellation.\n- [ ] Add external subscriber bridge helpers."
    },
    {
      "ref": "epic-showcase-docs",
      "title": "Showcase, tests, docs, and release readiness",
      "type": "epic",
      "priority": "critical",
      "body": "## Goal\nValidate the library with a showcase app, automated tests, documentation, examples, and final release checks.\n\n## Todo\n- [ ] Build the interactive showcase page.\n- [ ] Add browser and unit test coverage.\n- [ ] Update README and packaged examples.\n- [ ] Run final validation commands and clear release blockers."
    },
    {
      "ref": "epic-ci-docs",
      "title": "CI/CD, contributor hooks, and VitePress documentation",
      "type": "epic",
      "priority": "critical",
      "body": "## Goal\nAdd GitHub Actions automation, local contributor hooks, and a VitePress documentation site for the npm library.\n\n## Todo\n- [ ] Add CI validation workflows.\n- [ ] Add npm publish and release automation.\n- [ ] Add Husky and lint-staged contributor hooks.\n- [ ] Create and deploy the VitePress documentation site."
    }
  ]
}
```

## Batch 3 — Features grouped by epic

### Under `epic-core-api`

```json
{
  "sharedParentRef": "epic-core-api",
  "items": [
    {
      "ref": "feature-root-define-store",
      "title": "Root manager and store definition",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nImplement the manager primitives and `defineStore()` entry point.\n\n## Todo\n- [ ] Scaffold root manager, plugin registry, and SSR context modules.\n- [ ] Implement `defineStore()` for option and setup stores."
    },
    {
      "ref": "feature-types-exports",
      "title": "Types, refs helper, and public exports",
      "type": "feature",
      "priority": "high",
      "body": "## Goal\nProvide strict typings, a safe `storeToRefs()` helper, and a stable public API surface.\n\n## Todo\n- [ ] Add core public typings.\n- [ ] Add reactive `storeToRefs()` helper.\n- [ ] Finalize public package exports."
    }
  ]
}
```

### Under `epic-runtime`

```json
{
  "sharedParentRef": "epic-runtime",
  "items": [
    {
      "ref": "feature-store-instantiation",
      "title": "Option and setup store instantiation",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nImplement runtime instantiation for option stores and setup stores.\n\n## Todo\n- [ ] Implement option-store runtime.\n- [ ] Implement setup-store runtime."
    },
    {
      "ref": "feature-store-shell",
      "title": "Store shell and commit batching",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nImplement store instance helpers and grouped commit batching.\n\n## Todo\n- [ ] Implement store shell helpers.\n- [ ] Implement grouped mutation queue."
    },
    {
      "ref": "feature-subscriptions-timeline",
      "title": "Subscriptions and timeline recording",
      "type": "feature",
      "priority": "high",
      "body": "## Goal\nImplement state/action subscriptions and internal timeline recording.\n\n## Todo\n- [ ] Implement subscription lifecycle handling.\n- [ ] Add internal devtools timeline recorder."
    }
  ]
}
```

### Under `epic-persistence-history`

```json
{
  "sharedParentRef": "epic-persistence-history",
  "items": [
    {
      "ref": "feature-persistence",
      "title": "Persistence core and storage adapters",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nImplement persistence plugin core, storage adapters, and optional compression.\n\n## Todo\n- [ ] Implement persistence plugin core.\n- [ ] Implement local, session, memory, and IndexedDB adapters.\n- [ ] Add optional LZ compression support."
    },
    {
      "ref": "feature-history",
      "title": "Undo, redo, and time travel",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nImplement history tracking, undo/redo, and timeline replay.\n\n## Todo\n- [ ] Implement history controller.\n- [ ] Implement time-travel replay."
    },
    {
      "ref": "feature-plugin-options",
      "title": "Typed plugin options for persist and history",
      "type": "feature",
      "priority": "normal",
      "body": "## Goal\nExpose typed store options for persistence and history plugins.\n\n## Todo\n- [ ] Add typed `persist` options.\n- [ ] Add typed `history` options.\n- [ ] Ensure both store syntaxes accept plugin options."
    }
  ]
}
```

### Under `epic-sync-async`

```json
{
  "sharedParentRef": "epic-sync-async",
  "items": [
    {
      "ref": "feature-sync",
      "title": "Multi-tab sync transport and validation",
      "type": "feature",
      "priority": "high",
      "body": "## Goal\nImplement cross-tab synchronization with validation and self-event filtering.\n\n## Todo\n- [ ] Implement BroadcastChannel and storage-event transports.\n- [ ] Validate inbound sync payloads before patching."
    },
    {
      "ref": "feature-async",
      "title": "Async action tracking and concurrency control",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nImplement async action tracking, concurrency policies, cancellation, and external event bridges.\n\n## Todo\n- [ ] Add async plugin and tracked action wrapper.\n- [ ] Implement concurrency policy engine.\n- [ ] Add abort and stale-result protection.\n- [ ] Add external subscriber bridge helpers."
    }
  ]
}
```

### Under `epic-showcase-docs`

```json
{
  "sharedParentRef": "epic-showcase-docs",
  "items": [
    {
      "ref": "feature-showcase",
      "title": "Showcase UI and browser validation",
      "type": "feature",
      "priority": "high",
      "body": "## Goal\nBuild the showcase page and validate it with browser tests.\n\n## Todo\n- [ ] Build the interactive showcase page.\n- [ ] Add browser integration tests."
    },
    {
      "ref": "feature-tests-docs",
      "title": "Unit tests, docs, and packaged examples",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nAdd unit coverage, README documentation, and packaged examples.\n\n## Todo\n- [ ] Add unit test coverage.\n- [ ] Update README and migration guidance.\n- [ ] Add packaged example source files."
    },
    {
      "ref": "feature-release-gate",
      "title": "Final verification and release gate",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nRun final validation commands and clear release blockers.\n\n## Todo\n- [ ] Run check, lint, test, and build.\n- [ ] Fix packaging, export, and release-blocking issues."
    }
  ]
}
```

### Under `epic-ci-docs`

```json
{
  "sharedParentRef": "epic-ci-docs",
  "items": [
    {
      "ref": "feature-ci-release",
      "title": "GitHub Actions CI and npm release automation",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nImplement pull-request CI and npm-library release automation.\n\n## Todo\n- [ ] Add CI workflow for validation.\n- [ ] Add release workflow for npm publish.\n- [ ] Add release-management support files and docs."
    },
    {
      "ref": "feature-dev-hooks",
      "title": "Local quality gates with Husky and lint-staged",
      "type": "feature",
      "priority": "high",
      "body": "## Goal\nImplement contributor hooks for formatting, linting, svelte-check, and local validation.\n\n## Todo\n- [ ] Configure pre-commit staged-file hooks.\n- [ ] Configure pre-push validation hooks.\n- [ ] Add format and automation-aligned scripts."
    },
    {
      "ref": "feature-vitepress-docs",
      "title": "VitePress documentation site and deployment",
      "type": "feature",
      "priority": "critical",
      "body": "## Goal\nCreate a VitePress docs site and automate its build and deployment.\n\n## Todo\n- [ ] Scaffold the VitePress site.\n- [ ] Author the documentation content.\n- [ ] Add docs build and deployment automation."
    }
  ]
}
```

## Batch 4 — Tasks grouped by feature

### Under `feature-root-define-store`

```json
{
  "sharedParentRef": "feature-root-define-store",
  "items": [
    {
      "ref": "task-001",
      "title": "Scaffold root manager and SSR context modules",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `src/lib/root/create-state-manager.ts` with the root manager interface and lifecycle skeleton.\n- [ ] Create `src/lib/root/state-manager-context.ts` with Svelte context helpers for request-scoped access.\n- [ ] Create `src/lib/root/types.ts` for manager, plugin, and lifecycle contracts.\n- [ ] Document SPA-only versus SSR-safe manager usage in code-level type comments where needed."
    },
    {
      "ref": "task-002",
      "title": "Implement defineStore entry point",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `src/lib/define-store.svelte.ts` supporting option-store signatures.\n- [ ] Add setup-store overloads and bind store definitions to a concrete manager instance.\n- [ ] Enforce unique store ids and consistent store registration semantics.\n- [ ] Add error messages for invalid definition shapes."
    }
  ]
}
```

### Under `feature-types-exports`

```json
{
  "sharedParentRef": "feature-types-exports",
  "items": [
    {
      "ref": "task-003",
      "title": "Add core public typings",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Define `StoreState`, `StoreGetters`, `StoreActions`, and `StoreDefinition` generics.\n- [ ] Define mutation and action hook context types.\n- [ ] Add plugin augmentation interfaces for future extension.\n- [ ] Verify strict TypeScript inference works for both option and setup stores."
    },
    {
      "ref": "task-004",
      "title": "Add reactive storeToRefs helper",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/pinia-like/store-to-refs.svelte.ts`.\n- [ ] Ensure extracted members stay reactive under Svelte 5 constraints.\n- [ ] Exclude action methods from ref extraction.\n- [ ] Add typings for state and getter extraction behavior."
    },
    {
      "ref": "task-005",
      "title": "Publish stable package exports",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Update `src/lib/index.ts` to export the stable core entry points.\n- [ ] Export plugin factory entry points without leaking unstable internals.\n- [ ] Verify the package entry shape matches the intended public API surface."
    }
  ]
}
```

### Under `feature-store-instantiation`

```json
{
  "sharedParentRef": "feature-store-instantiation",
  "items": [
    {
      "ref": "task-006",
      "title": "Implement option-store runtime",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `src/lib/runtime/create-option-store.svelte.ts`.\n- [ ] Convert `state()` output into reactive store state.\n- [ ] Bind getters as derived accessors and actions as store-bound methods.\n- [ ] Verify direct property mutation flows through the runtime correctly."
    },
    {
      "ref": "task-007",
      "title": "Implement setup-store runtime",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `src/lib/runtime/create-setup-store.svelte.ts`.\n- [ ] Classify returned members into state, getters, and actions.\n- [ ] Guard against private/non-returned state breaking serialization or plugins.\n- [ ] Verify method binding and exposed-member typing."
    }
  ]
}
```

### Under `feature-store-shell`

```json
{
  "sharedParentRef": "feature-store-shell",
  "items": [
    {
      "ref": "task-008",
      "title": "Implement store shell helpers",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `src/lib/runtime/store-shell.svelte.ts`.\n- [ ] Implement `$id`, `$state`, `$patch`, `$reset`, `$subscribe`, `$onAction`, and `$dispose`.\n- [ ] Ensure all state changes route through a common mutation hook.\n- [ ] Add safe reset behavior for option and setup stores."
    },
    {
      "ref": "task-009",
      "title": "Add grouped mutation queue",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/runtime/mutation-queue.svelte.ts`.\n- [ ] Group synchronous patch-function mutations into one logical commit.\n- [ ] Expose commit metadata for history, persistence, and sync integrations.\n- [ ] Verify nested or chained mutation scenarios behave deterministically."
    }
  ]
}
```

### Under `feature-subscriptions-timeline`

```json
{
  "sharedParentRef": "feature-subscriptions-timeline",
  "items": [
    {
      "ref": "task-010",
      "title": "Implement state and action subscription lifecycles",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/runtime/subscriptions.ts`.\n- [ ] Implement mutation subscription callbacks and detached subscription behavior.\n- [ ] Implement action hooks with `after` and `onError` callbacks.\n- [ ] Ensure cleanup works inside and outside components."
    },
    {
      "ref": "task-011",
      "title": "Add internal devtools timeline recorder",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/runtime/devtools-timeline.svelte.ts`.\n- [ ] Record mutation and action events with labels, timestamps, and durations.\n- [ ] Capture snapshots or patch metadata needed for later replay.\n- [ ] Expose a read API suitable for the showcase debugger UI."
    }
  ]
}
```

### Under `feature-persistence`

```json
{
  "sharedParentRef": "feature-persistence",
  "items": [
    {
      "ref": "task-012",
      "title": "Implement persistence plugin core",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `src/lib/persistence/types.ts` for persist config and adapter contracts.\n- [ ] Create `src/lib/persistence/plugin.svelte.ts` for install-time store augmentation.\n- [ ] Create `src/lib/persistence/serialize.ts` using `$state.snapshot()` and migration hooks.\n- [ ] Validate versioned rehydration and safe deserialization behavior."
    },
    {
      "ref": "task-013",
      "title": "Implement storage adapters",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Add localStorage adapter.\n- [ ] Add sessionStorage adapter.\n- [ ] Add in-memory adapter.\n- [ ] Add IndexedDB adapter with async get/set/remove/clear/keys operations."
    },
    {
      "ref": "task-014",
      "title": "Add opt-in LZ compression",
      "type": "task",
      "priority": "normal",
      "body": "## Todo\n- [ ] Add `lz-string` integration under `src/lib/persistence/compression/lz-string.ts`.\n- [ ] Wire compression as an opt-in persist option.\n- [ ] Verify compressed payloads round-trip correctly.\n- [ ] Reject unsupported or invalid compressed input safely."
    }
  ]
}
```

### Under `feature-history`

```json
{
  "sharedParentRef": "feature-history",
  "items": [
    {
      "ref": "task-015",
      "title": "Implement history controller",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `src/lib/history/plugin.svelte.ts`.\n- [ ] Create `src/lib/history/history-controller.svelte.ts`.\n- [ ] Implement `undo`, `redo`, `canUndo`, `canRedo`, and bounded history retention.\n- [ ] Support explicit batch start/end grouping."
    },
    {
      "ref": "task-016",
      "title": "Implement time-travel replay",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/history/time-travel.svelte.ts`.\n- [ ] Replay historical snapshots through the same mutation pipeline as normal updates.\n- [ ] Prevent persistence and sync feedback loops during replay mode.\n- [ ] Expose replay metadata for the showcase debugger."
    }
  ]
}
```

### Under `feature-plugin-options`

```json
{
  "sharedParentRef": "feature-plugin-options",
  "items": [
    {
      "ref": "task-017",
      "title": "Add typed plugin options",
      "type": "task",
      "priority": "normal",
      "body": "## Todo\n- [ ] Extend `src/lib/pinia-like/plugin-options.ts` with `persist` config types.\n- [ ] Extend the same module with `history` config types.\n- [ ] Ensure both option-store and setup-store definitions accept the new options."
    }
  ]
}
```

### Under `feature-sync`

```json
{
  "sharedParentRef": "feature-sync",
  "items": [
    {
      "ref": "task-018",
      "title": "Implement sync transports",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/sync/plugin.svelte.ts`.\n- [ ] Create `src/lib/sync/broadcast-channel.ts` for primary cross-tab transport.\n- [ ] Create `src/lib/sync/storage-events.ts` as a fallback transport.\n- [ ] Add instance-origin filtering to ignore self-emitted events."
    },
    {
      "ref": "task-019",
      "title": "Validate inbound sync messages",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/sync/message-schema.ts`.\n- [ ] Validate store id, mutation id, version, payload shape, and timestamp fields.\n- [ ] Reject malformed or incompatible remote payloads.\n- [ ] Patch only after schema validation succeeds."
    }
  ]
}
```

### Under `feature-async`

```json
{
  "sharedParentRef": "feature-async",
  "items": [
    {
      "ref": "task-020",
      "title": "Add async plugin and tracked action wrapper",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `src/lib/async/plugin.svelte.ts`.\n- [ ] Create `src/lib/async/track-async-action.svelte.ts`.\n- [ ] Expose `isLoading`, `error`, `lastSuccessAt`, `lastFailureAt`, and `abort` state per tracked action.\n- [ ] Ensure sync and failure hooks integrate with `$onAction()` semantics."
    },
    {
      "ref": "task-021",
      "title": "Implement concurrency policy engine",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/async/concurrency.ts`.\n- [ ] Implement `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe` modes.\n- [ ] Bind policy selection to per-action async options.\n- [ ] Verify deterministic behavior when actions are called rapidly."
    },
    {
      "ref": "task-022",
      "title": "Add abort and stale-result protection",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/lib/async/request-controller.ts`.\n- [ ] Use `AbortController` for cancellable action execution.\n- [ ] Track action-call tokens to prevent stale responses from overwriting new state.\n- [ ] Ensure cancellation updates loading/error metadata correctly."
    },
    {
      "ref": "task-023",
      "title": "Bridge external event systems into reactivity",
      "type": "task",
      "priority": "normal",
      "body": "## Todo\n- [ ] Create `src/lib/async/external-subscribe.ts`.\n- [ ] Use `createSubscriber` for browser or network event integrations.\n- [ ] Provide a reusable pattern for future websocket or observer-backed stores."
    }
  ]
}
```

### Under `feature-showcase`

```json
{
  "sharedParentRef": "feature-showcase",
  "items": [
    {
      "ref": "task-024",
      "title": "Build the interactive showcase page",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Replace `src/routes/+page.svelte` with a demo for core store usage.\n- [ ] Demonstrate persistence, undo/redo, time travel, multi-tab sync, and async cancellation.\n- [ ] Include SSR-safe manager wiring patterns in the showcase structure.\n- [ ] Make the demo suitable for both manual testing and package marketing."
    },
    {
      "ref": "task-026",
      "title": "Add browser integration tests for showcase behavior",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Create `src/routes/+page.svelte.spec.ts` or equivalent browser test file.\n- [ ] Validate showcase behavior from the user perspective.\n- [ ] Cover persistence, history, sync, and async UI flows without relying on internal implementation details."
    }
  ]
}
```

### Under `feature-tests-docs`

```json
{
  "sharedParentRef": "feature-tests-docs",
  "items": [
    {
      "ref": "task-025",
      "title": "Add unit test coverage for the library runtime",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Add `define-store.spec.ts` and `patching.spec.ts`.\n- [ ] Add `history.spec.ts` and `persistence.spec.ts`.\n- [ ] Add `sync.spec.ts` and `async.spec.ts`.\n- [ ] Verify plugin interactions and edge cases described in the main plan."
    },
    {
      "ref": "task-027",
      "title": "Update README and migration guidance",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Document installation and public API usage.\n- [ ] Document SPA-only and SSR-safe usage patterns separately.\n- [ ] Add plugin configuration examples.\n- [ ] Add a Pinia mental-model and migration section."
    },
    {
      "ref": "task-028",
      "title": "Add packaged example source files",
      "type": "task",
      "priority": "normal",
      "body": "## Todo\n- [ ] Create `src/lib/examples/option-store` examples.\n- [ ] Create `src/lib/examples/setup-store` examples.\n- [ ] Add persistence, history, sync, and async focused examples.\n- [ ] Ensure examples mirror the final public API exactly."
    }
  ]
}
```

### Under `feature-release-gate`

```json
{
  "sharedParentRef": "feature-release-gate",
  "items": [
    {
      "ref": "task-029",
      "title": "Run final validation and fix release blockers",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Run `npm run check` and fix type/runtime issues.\n- [ ] Run `npm run lint` and fix lint issues.\n- [ ] Run `npm run test` and fix unit/browser test failures.\n- [ ] Run `npm run build` and fix packaging/export issues.\n- [ ] Confirm the package is ready for release-quality review."
    }
  ]
}
```

### Under `feature-ci-release`

```json
{
  "sharedParentRef": "feature-ci-release",
  "items": [
    {
      "ref": "task-030",
      "title": "Add pull-request and mainline CI workflow",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `.github/workflows/ci.yml`.\n- [ ] Run install plus `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` in CI.\n- [ ] Add package-quality verification through the existing package scripts.\n- [ ] Ensure the workflow runs on pull requests and protected branches."
    },
    {
      "ref": "task-031",
      "title": "Add npm publish and release workflow",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Create `.github/workflows/release.yml` for npm-library publishing.\n- [ ] Define the publish trigger and versioning flow for releases.\n- [ ] Configure provenance-friendly publish settings and secret or trusted-publisher requirements.\n- [ ] Ensure release automation does not publish when validation fails."
    },
    {
      "ref": "task-032",
      "title": "Add release management support files and docs",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Add `.changeset/` or the chosen release-management configuration.\n- [ ] Update package publish metadata as needed for npm delivery.\n- [ ] Document the release flow for maintainers.\n- [ ] Validate that a dry-run release path is deterministic."
    }
  ]
}
```

### Under `feature-dev-hooks`

```json
{
  "sharedParentRef": "feature-dev-hooks",
  "items": [
    {
      "ref": "task-033",
      "title": "Configure pre-commit staged-file hooks",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Configure `lint-staged` patterns for staged file validation.\n- [ ] Add `.husky/pre-commit`.\n- [ ] Run Biome format/check and ESLint in the staged-file flow.\n- [ ] Keep pre-commit feedback fast enough for normal contributor use."
    },
    {
      "ref": "task-034",
      "title": "Configure pre-push validation hooks",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Add `.husky/pre-push`.\n- [ ] Run `svelte-check` before push.\n- [ ] Run the appropriate local test command before push.\n- [ ] Document the intended split between pre-commit, pre-push, and CI checks."
    },
    {
      "ref": "task-035",
      "title": "Add format and automation-aligned scripts",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Add `format` and `format:check` scripts to `package.json`.\n- [ ] Align hook commands with package-manager scripts so local and CI behavior match.\n- [ ] Add or refine Biome configuration if needed for formatting and checks.\n- [ ] Verify hooks and scripts do not conflict with ESLint or Svelte tooling."
    }
  ]
}
```

### Under `feature-vitepress-docs`

```json
{
  "sharedParentRef": "feature-vitepress-docs",
  "items": [
    {
      "ref": "task-036",
      "title": "Scaffold the VitePress site",
      "type": "task",
      "priority": "critical",
      "body": "## Todo\n- [ ] Add `docs/.vitepress/config.ts`.\n- [ ] Create the VitePress site structure under `docs/`.\n- [ ] Configure navigation, sidebar, and site metadata.\n- [ ] Add a docs landing page and primary guide entry points."
    },
    {
      "ref": "task-037",
      "title": "Author VitePress documentation content",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Document installation and package consumption as an npm library.\n- [ ] Document `defineStore`, option stores, and setup stores.\n- [ ] Document SSR-safe usage, plugins, persistence, history, sync, and async orchestration.\n- [ ] Add migration, testing, and troubleshooting guides."
    },
    {
      "ref": "task-038",
      "title": "Add docs build and deployment automation",
      "type": "task",
      "priority": "high",
      "body": "## Todo\n- [ ] Add a docs workflow under `.github/workflows/docs.yml`.\n- [ ] Integrate VitePress build validation into CI.\n- [ ] Configure deployment for the generated static docs site.\n- [ ] Verify docs deployment does not drift from the library release flow."
    }
  ]
}
```

## Batch 5 — Blocking relationships to apply after creation

Use the real bean IDs from the mapping sheet.

```json
[
  { "ref": "task-002", "blockedByRefs": ["task-001"] },
  { "ref": "task-003", "blockedByRefs": ["task-002"] },
  { "ref": "task-004", "blockedByRefs": ["task-003"] },
  { "ref": "task-005", "blockedByRefs": ["task-003", "task-004"] },
  { "ref": "task-006", "blockedByRefs": ["task-005"] },
  { "ref": "task-007", "blockedByRefs": ["task-006"] },
  { "ref": "task-008", "blockedByRefs": ["task-007"] },
  { "ref": "task-009", "blockedByRefs": ["task-008"] },
  { "ref": "task-010", "blockedByRefs": ["task-009"] },
  { "ref": "task-011", "blockedByRefs": ["task-010"] },
  { "ref": "task-012", "blockedByRefs": ["task-011"] },
  { "ref": "task-013", "blockedByRefs": ["task-012"] },
  { "ref": "task-014", "blockedByRefs": ["task-013"] },
  { "ref": "task-015", "blockedByRefs": ["task-009", "task-012"] },
  { "ref": "task-016", "blockedByRefs": ["task-015"] },
  { "ref": "task-017", "blockedByRefs": ["task-012", "task-015"] },
  { "ref": "task-018", "blockedByRefs": ["task-016"] },
  { "ref": "task-019", "blockedByRefs": ["task-018"] },
  { "ref": "task-020", "blockedByRefs": ["task-010"] },
  { "ref": "task-021", "blockedByRefs": ["task-020"] },
  { "ref": "task-022", "blockedByRefs": ["task-021"] },
  { "ref": "task-023", "blockedByRefs": ["task-022"] },
  { "ref": "task-024", "blockedByRefs": ["task-016", "task-019", "task-022"] },
  { "ref": "task-025", "blockedByRefs": ["task-023"] },
  { "ref": "task-026", "blockedByRefs": ["task-024"] },
  { "ref": "task-027", "blockedByRefs": ["task-024", "task-025"] },
  { "ref": "task-028", "blockedByRefs": ["task-027"] },
  { "ref": "task-029", "blockedByRefs": ["task-025", "task-026", "task-027", "task-028"] },
  { "ref": "task-030", "blockedByRefs": ["task-005"] },
  { "ref": "task-031", "blockedByRefs": ["task-030"] },
  { "ref": "task-032", "blockedByRefs": ["task-031"] },
  { "ref": "task-033", "blockedByRefs": ["task-030"] },
  { "ref": "task-034", "blockedByRefs": ["task-033"] },
  { "ref": "task-035", "blockedByRefs": ["task-033", "task-034"] },
  { "ref": "task-036", "blockedByRefs": ["task-027"] },
  { "ref": "task-037", "blockedByRefs": ["task-036"] },
  { "ref": "task-038", "blockedByRefs": ["task-036", "task-037"] }
]
```

## Suggested creation order summary

1. `milestone-v1`
2. all epics
3. all features grouped by epic
4. all tasks grouped by feature
5. blocking relationships

## Notes

- This manifest is intentionally grouped by shared parent to fit batch-creation workflows.
- If your bulk-create interface supports only one parent per call, run one batch block at a time.
- If your creation interface also supports tags, consider tagging all items with `svelte-5`, `state-library`, and `pinia-like`.
