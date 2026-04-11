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
| Inspect stores in a browser drawer during dev  | `statelyVitePlugin()`       |

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
		version: 1,
		compression: createLzStringCompression()
	}
});
```
