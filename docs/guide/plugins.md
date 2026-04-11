# Plugins

Plugins are opt-in and attach through `createStateManager().use(...)`.
Store definitions carry typed `persist` and `history` options, while the manager decides which plugins are active.

Use the [reference pages](/reference/api) when you need exact API shapes and
return values. Use this guide when you want to decide which plugin to reach for
and how the pieces fit together in a real app.

## Which plugin should I use?

| Need                                           | Use                         |
| ---------------------------------------------- | --------------------------- |
| Keep state after reloads                       | `createPersistencePlugin()` |
| Support undo and redo                          | `createHistoryPlugin()`     |
| Sync state across tabs                         | `createSyncPlugin()`        |
| Track loading and error state on async actions | `createAsyncPlugin()`       |

## Persistence

The persistence plugin hydrates state from storage and flushes snapshots through the same store interface.
Stately exports adapters for memory, `localStorage`, `sessionStorage`, and
IndexedDB-shaped backends, plus optional `lz-string` compression.

Use persistence when the store owns durable user settings, drafts, or other state that should survive navigation and reloads.

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
	state: () => ({ theme: 'dark' }),
	persist: {
		adapter: createLocalStorageAdapter(),
		key: 'stately:session',
		version: 1,
		compression: createLzStringCompression()
	}
});
```

Important behavior:

- `version` is required so you can migrate stored data safely.
- `ready` resolves after the initial rehydration attempt.
- `flush()` writes the current snapshot immediately.
- `clear()` removes the stored payload.
- `pause()` and `resume()` let you control automatic writes during batch updates.

## History and time travel

History tracking records snapshots and exposes undo/redo controls.
Time travel replays snapshots through the normal patch pipeline while suppressing persistence and sync feedback loops.

Use history for form drafts, editors, or internal debugging tools where users
need to move backward and forward through meaningful states.

```ts
import { createHistoryPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createHistoryPlugin());

export const useDraftStore = defineStore('draft', {
	state: () => ({ body: '' }),
	history: { limit: 25 }
});
```

The controller gives you `undo()`, `redo()`, `goTo(index)`, and batching
helpers so you can group changes into a single history entry.

## Sync

The sync plugin propagates patches between managers in separate tabs or windows.
The default transport stack uses `BroadcastChannel` with a storage-event
fallback, and custom transports can be supplied for tests or embedded
environments.

Use sync when the same store should feel shared across windows, tabs, or embedded surfaces.

```ts
import { createStateManager, createSyncPlugin, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createSyncPlugin({ origin: 'local-tab' }));
```

The plugin filters out self-originated messages, rejects mismatched versions, and only patches known state keys.

## Async orchestration

The async plugin tracks loading, error, and completion metadata per action.
It supports `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe` concurrency policies.

Use async orchestration when action overlap, stale results, or cancellation are real problems rather than theoretical ones.

```ts
import { createAsyncPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(
	createAsyncPlugin({
		include: ['loadCount'],
		policies: { loadCount: 'restartable' }
	})
);
```

If you pass an `AbortSignal` into your actions, the restartable policy can cancel active work before starting the next request.

See [Examples and recipes](/guide/examples) for end-to-end usage patterns that combine multiple plugins.
