# Plugins

Plugins are opt-in and attach through `createStateManager().use(...)`.
Store definitions carry typed `persist` and `history` options, while the manager decides which plugins are active.

## Persistence

The persistence plugin hydrates state from storage and flushes snapshots through the same store interface.
Stately exports adapters for memory, `localStorage`, `sessionStorage`, and IndexedDB-shaped backends, plus optional `lz-string` compression.

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

## History and time travel

History tracking records snapshots and exposes undo/redo controls.
Time travel replays snapshots through the normal patch pipeline while suppressing persistence and sync feedback loops.

## Sync

The sync plugin propagates patches between managers in separate tabs or windows.
The default transport stack uses `BroadcastChannel` with a storage-event fallback, and custom transports can be supplied for tests or embedded environments.

## Async orchestration

The async plugin tracks loading, error, and completion metadata per action.
It supports `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe` concurrency policies.
