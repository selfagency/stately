# Public API reference

Stately exports the following runtime entry points from the package root.

## Core runtime

- `defineStore`
- `createStateManager`
- `getDefaultStateManager`
- `initializeStateManagerContext`
- `getStateManager`
- `setStateManager`
- `storeToRefs`

## Plugins

- `createPersistencePlugin`
- `createHistoryPlugin`
- `createSyncPlugin`
- `createAsyncPlugin`
- `createExternalSubscriber`

## Persistence helpers

- `createLocalStorageAdapter`
- `createSessionStorageAdapter`
- `createMemoryStorageAdapter`
- `createIndexedDbAdapter`
- `createLzStringCompression`

## Selected public types

- `StateManager`
- `StateManagerPlugin`
- `StoreDefinition`
- `StoreInstance`
- `StoreState`
- `StoreActions`
- `StoreGetters`
- `PersistOptions`
- `PersistController`
- `PersistenceAdapter`
- `HistoryController`
- `TimeTravelController`
- `AsyncActionRegistry`
- `AsyncPluginOptions`
- `SyncMessage`
- `SyncTransport`

For consumer-facing usage patterns, prefer the guide pages and packaged examples over runtime internals.
