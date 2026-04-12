# Plugins

Plugins are opt-in. Attach them to a manager with
`createStateManager().use(...)`, then opt a store into the matching feature
through its definition options.

Each plugin provides exactly one capability and does not affect stores that do not configure it.
Use this page to choose the right one for the job. Use the
[reference pages](/reference/api) when you need exact signatures, controller
shapes, or type names.

## Choose the right plugin

- Keep state after reloads, sessions, or restarts
  - Use `createPersistencePlugin()`
  - Read next: [Persistence helpers](/reference/persistence)
- Support undo, redo, and time travel
  - Use `createHistoryPlugin()`
  - Read next: [Plugins and orchestration](/reference/plugins)
- Model explicit workflow states
  - Use `createFsmPlugin()`
  - Read next: [Finite state machines](/guide/fsm)
- Keep multiple tabs in sync
  - Use `createSyncPlugin()`
  - Read next: [Plugins and orchestration](/reference/plugins)
- Track loading, errors, cancellation, and concurrency
  - Use `createAsyncPlugin()`
  - Read next: [Examples and recipes](/guide/examples)
- Reject invalid state patches
  - Use `createValidationPlugin()`
  - Read next: [Validation](/guide/validation)
- Inspect stores during development
  - Use `statelyVitePlugin()` and inspector helpers
  - Read next: [Inspector](/guide/inspector)

## Persistence

Use persistence when the store owns durable settings, drafts, or session state
that should survive reloads.

Stately supports:

- memory, `localStorage`, `sessionStorage`, and IndexedDB-shaped adapters
- optional `lz-string` compression
- custom `serialize()` and `deserialize()` hooks
- `pick` and `omit` for selective persistence
- `migrate()` for schema upgrades
- `ttl` to discard stale persisted state on rehydration

```ts
import {
	createLocalStorageAdapter,
	createLzStringCompression,
	createPersistencePlugin,
	createStateManager,
	defineStore
} from '@selfagency/stately';

const manager = createStateManager().use(createPersistencePlugin());

export const useSessionStore = defineStore('session', {
	state: () => ({ theme: 'dark', token: '' }),
	persist: {
		adapter: createLocalStorageAdapter(),
		version: 1,
		omit: ['token'],
		compression: createLzStringCompression()
	}
});
```

Use [Persistence helpers](/reference/persistence) for the full option surface.

## History and time travel

Use history when users benefit from undo and redo, or when you need replayable
debugging.

The history plugin adds `$history` and `$timeTravel`, including:

- `undo()` and `redo()`
- `goTo(index)` for replaying a specific snapshot
- `record(snapshot)` for manual entries
- `startBatch()` and `endBatch()` for grouping several mutations into one
  logical history entry

Time travel intentionally suppresses persistence and sync side effects during
replay so you do not create feedback loops or overwrite current state with
historical snapshots.

## Finite state machines

Use the FSM plugin when the store has named workflow states and legal
transitions between them.

It is a better fit than ad hoc booleans when your UI needs states like `idle`,
`loading`, `success`, `error`, `editing`, or `submitted`.

The plugin adds `$fsm` with:

- `current`
- `send(event, ...args)`
- `matches(...states)`
- `can(event)`

Read [Finite state machines](/guide/fsm) for the full workflow pattern.

## Sync across tabs and environments

Use sync when multiple browser contexts should converge on the same store
state.

The sync plugin:

- uses BroadcastChannel when available and storage events as a fallback
  transport stack
- rejects mismatched versions
- ignores self-originated messages
- applies a timestamp-first ordering policy with deterministic origin and
  `mutationId` tie-breakers
- only patches known state keys

Use [Plugins and orchestration](/reference/plugins) for the detailed conflict
rules.

## Async orchestration

Use the async plugin when actions can overlap or be cancelled.

It adds a `$async` registry and supports concurrency policies such as:

- `parallel`
- `restartable`
- `drop`
- `enqueue`
- `dedupe`

If you need cancellation, configure `injectSignal` so the wrapped action
receives an `AbortSignal` in the position your action expects.

## Validation

Use validation when state changes must satisfy invariants immediately after a
patch completes.

The validation plugin can:

- accept a patch by returning `true` or `undefined`
- reject a patch by returning an error string
- roll the store back to the previous snapshot on failure
- call `onValidationError` before throwing

Read [Validation](/guide/validation) for the usage pattern and
[Validation reference](/reference/validation) for the exact behavior.

## Plugin authoring

Most consumers can stop here.

If you are authoring your own plugin, use the public types in
[Public types](/reference/types). In particular:

- augment `DefineStoreOptionsBase` for new store-definition options
- augment `StoreCustomProperties` for new store instance properties
- prefer `defineStateManagerPlugin()` when you want compile-time checking for
  the augmentation shape the plugin returns
