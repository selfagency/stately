# Plugins and orchestration

Plugins are opt-in. Attach them to a manager with
`createStateManager().use(...)`, then opt stores into the relevant feature
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

Each plugin augments stores only when the store definition opts into the matching feature.

## `createPersistencePlugin()`

The persistence plugin hydrates state from storage and writes snapshots back through the store’s mutation pipeline.

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

```ts
import { createHistoryPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createHistoryPlugin());

export const useDraftStore = defineStore('draft', {
	state: () => ({ body: '' }),
	history: { limit: 25 }
});
```

## `createSyncPlugin(options?)`

The sync plugin publishes store snapshots across tabs or embedded
environments and applies validated inbound updates to matching stores.

Use it when multiple browser contexts should stay in sync.

Key behavior:

- ignores self-originated messages
- rejects mismatched versions
- only patches known state keys
- cleans up transports during `$dispose()`

Important options:

- `origin` to identify the current tab or instance
- `version` to reject incompatible payloads
- `channelName` / `storageKey` to customize the default transport stack
- `transports` to supply your own publish/subscribe bridge
- `createId` and `createTimestamp` for deterministic tests

```ts
import { createStateManager, createSyncPlugin, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createSyncPlugin({ origin: 'local-tab' }));
```

## `createAsyncPlugin(options?)`

The async plugin tracks action state and wraps matching actions with concurrency control.

Use it when actions can overlap, be cancelled, or need loading/error metadata.

Key behavior:

- adds a `$async` registry keyed by action name
- wraps matching actions and keeps the action hook semantics intact
- supports `include` to limit which actions are tracked
- supports `policies` and a shared `policy` override for concurrency control
- can inject an `AbortSignal` into actions for cancellation flows

Supported policies:

- `parallel`
- `restartable`
- `drop`
- `enqueue`
- `dedupe`

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

## Working with plugin cleanup

Plugins commonly extend `$dispose()` to clean up subscriptions, transports, or other external resources.
That means you should treat `$dispose()` as the store’s teardown point, not
just a convenience method.

## Development inspector

The inspector is not a state-manager plugin, so it is documented separately.
Use [Inspector](/reference/inspector) for the dev-only runtime helpers and the
Vite integration export.
