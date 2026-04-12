# Plugins and orchestration

Each plugin is a modular addition to the manager. Attach them with
`createStateManager().use(...)`, then opt individual stores into the matching feature
through their definition options.

## How the plugin model fits together

```ts
import {
	createAsyncPlugin,
	createHistoryPlugin,
	createPersistencePlugin,
	createStateManager,
	createSyncPlugin
} from '@selfagency/stately';

const manager = createStateManager()
	.use(createPersistencePlugin())
	.use(createHistoryPlugin())
	.use(createSyncPlugin())
	.use(createAsyncPlugin());
```

Each plugin augments stores only when the store definition opts into the
matching feature.

## `createPersistencePlugin()`

The persistence plugin hydrates state from storage and writes snapshots back
through the store’s mutation pipeline.

Use it when a store should survive reloads, sessions, or app restarts.

Key behavior:

- requires a `persist` option with a `version` and a `PersistenceAdapter`
- exposes `$persist.ready`, `$persist.flush()`, `$persist.rehydrate()`, `$persist.clear()`, `$persist.pause()`, and `$persist.resume()`
- queues writes so older snapshots do not overwrite newer ones
- cancels any pending debounced flush before `$persist.clear()` removes stored state
- supports optional compression and custom serialize/deserialize hooks
- suppresses writes while replaying history or during explicit pause/rehydrate flows

```ts
import {
	createLocalStorageAdapter,
	createPersistencePlugin,
	createStateManager,
	defineStore
} from '@selfagency/stately';

const manager = createStateManager().use(createPersistencePlugin());

export const useSessionStore = defineStore('session', {
	state: () => ({ theme: 'dark' }),
	persist: {
		adapter: createLocalStorageAdapter(),
		key: 'stately:session',
		version: 1
	}
});
```

See [Persistence helpers](/reference/persistence) for adapter and compression options.

## `createHistoryPlugin()`

The history plugin records snapshots and adds undo/redo/time-travel helpers.

Use it for draft editing, debugging, or user-facing time travel.

Key behavior:

- requires a `history` option on the store definition
- exposes `$history` and `$timeTravel`
- supports `undo()`, `redo()`, `goTo(index)`, `record(snapshot)`, `startBatch()`, and `endBatch()` through the history controller
- replays snapshots without re-triggering history recording
- avoids persistence and sync feedback loops during time travel
- exposes `canUndo`, `canRedo`, `entries`, and `currentIndex` through `$history`

```ts
import { createHistoryPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createHistoryPlugin());

export const useDraftStore = defineStore('draft', {
	state: () => ({ body: '' }),
	history: { limit: 25 }
});
```

Use `startBatch()` and `endBatch()` when several mutations should become one
logical history entry.

## `createFsmPlugin()`

The FSM plugin adds explicit workflow state to stores that declare an `fsm`
definition.

Use it when a store should move through named states rather than coordinating a
pile of booleans.

Key behavior:

- requires an `fsm` option with `initial` and `states`
- adds `$fsm.current`, `$fsm.send()`, `$fsm.matches()`, and `$fsm.can()`
- patches transitions through the store so history, persistence, and sync can
  observe them
- stores the current state in an internal `__stately_fsm` key for plugin
  interoperability

Read [Finite state machines](/reference/fsm) for the exact option and
controller contracts.

## `createValidationPlugin()`

The validation plugin wraps `$patch()` for stores that declare `validate`.

Use it when invalid state should be rolled back immediately.

Key behavior:

- runs after the patch is applied
- accepts the mutation when `validate()` returns `true` or `undefined`
- restores the previous snapshot and throws `Error('Validation failed')` when `validate()` returns `false`; calls `onValidationError` first if present
- restores the previous snapshot when `validate()` returns an error string; calls `onValidationError` before throwing
- restores the previous snapshot and rethrows if `validate()` itself throws

Read [Validation](/reference/validation) for the full contract.

## `createSyncPlugin(options?)`

The sync plugin publishes store snapshots across tabs or embedded
environments and applies validated inbound updates to matching stores.

Use it when multiple browser contexts should stay in sync.

Key behavior:

- ignores self-originated messages
- rejects mismatched versions
- rejects stale same-origin `mutationId` values and older cross-origin updates
  once a newer mutation has been applied locally or remotely
- uses a timestamp-first ordering policy across origins, with deterministic
  origin and `mutationId` tie-breakers when timestamps match
- only patches known state keys
- cleans up transports during `$dispose()`

Conflict ordering works like this:

1. newer `timestamp` wins
2. if timestamps match, origin name order breaks the tie deterministically
3. if the origin also matches, higher `mutationId` wins

That keeps the sync behavior deterministic even when two contexts publish at
nearly the same time.

Important options:

- `origin` to identify the current tab or instance
- `version` to reject incompatible payloads
- `channelName` / `storageKey` to customize the default transport stack
- `transports` to supply your own publish/subscribe bridge
- `createId` for per-origin monotonic mutation ids
- `createTimestamp` for deterministic tests and cross-origin conflict ordering

```ts
import { createStateManager, createSyncPlugin, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createSyncPlugin({ origin: 'local-tab' }));
```

If you need a custom wire format, supply `createMessage`.
If you need a custom publish/subscribe bridge, supply `transports`.

## `createAsyncPlugin(options?)`

The async plugin tracks action state and wraps matching actions with
concurrency control.

Use it when actions can overlap, be cancelled, or need loading/error metadata.

Key behavior:

- adds a `$async` registry keyed by action name
- wraps matching actions and keeps the action hook semantics intact
- automatically tracks actions declared with the `async` keyword
- supports `include` to limit which actions are tracked and to explicitly opt
  promise-returning actions into tracking when they are declared without `async`
- supports `policies` and a shared `policy` override for concurrency control
- can inject an `AbortSignal` into actions for cancellation flows

Supported policies:

- `parallel`
- `restartable`
- `drop`
- `enqueue`
- `dedupe`

Policy guidance:

- `parallel` — let every invocation run
- `restartable` — cancel the current request when a new one starts
- `drop` — ignore new requests while one is active
- `enqueue` — run requests sequentially
- `dedupe` — reuse the active in-flight request

```ts
import { createAsyncPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(
	createAsyncPlugin({
		include: ['loadCount'],
		policies: { loadCount: 'restartable' },
		injectSignal(signal, args) {
			return [signal, ...args];
		}
	})
);
```

If you expect cancellation to work, wire `injectSignal` so the wrapped action
actually receives the `AbortSignal`. The plugin cannot guess your argument
order.

## Working with plugin cleanup

Plugins commonly extend `$dispose()` to clean up subscriptions, transports, or
other external resources.
That means you should treat `$dispose()` as the store’s teardown point, not
just a convenience method.

## Development inspector

The inspector is not a state-manager plugin, so it is documented separately.
Use [Inspector](/reference/inspector) for the dev-only runtime helpers and the
Vite integration export.
