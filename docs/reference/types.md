# Public types

Stately exports the most important types from the package root so plugin
authors and app code can keep strong inference all the way through the store
lifecycle.

## Store and manager types

- `StateManager` — the runtime container that owns plugins, definitions, and store instances
- `StateManagerPlugin` — a plugin function that can augment a store instance
- `StoreDefinition` — the callable definition returned by `defineStore()`
- `StoreInstance` — the fully materialized store type
- `StoreState`, `StoreGetters`, `StoreActions` — helper aliases used by inference

## Store hook types

- `StoreMutationContext` — payload passed to `$subscribe()` callbacks
- `StoreActionHookContext` — payload passed to `$onAction()` callbacks

`StoreMutationContext` exposes the store id, the store instance, the mutation type, and the payload when one exists.

`StoreActionHookContext` exposes the action name, arguments, and `after()` / `onError()` hooks.

## Store option augmentation

- `DefineStoreOptionsBase`
- `DefineSetupStoreOptions`
- `HistoryStoreOptions`
- `PersistStoreOptions`
- `StoreCustomProperties`
- `StoreCustomStateProperties`

These types exist so plugins can extend store definitions and store instances without losing IntelliSense.

## Persistence types

- `PersistenceAdapter`
- `PersistOptions`
- `PersistController`
- `PersistEnvelope`
- `PersistCompression`

## History, sync, and async types

- `HistoryController`
- `HistoryEntry`
- `TimeTravelController`
- `SyncMessage`
- `SyncTransport`
- `AsyncActionRegistry`
- `AsyncPluginOptions`
- `ConcurrencyMode`

Most of these types are used indirectly through plugin options or store
augmentation, but keeping them public means custom integrations can stay typed
end-to-end.

`SyncMessage` is the wire format for cross-context synchronization. `mutationId`
must increase monotonically per origin, while `timestamp` participates in
cross-origin last-write-wins ordering.

`AsyncPluginOptions` controls which actions are tracked and how concurrency is
handled. `include` can also be used as an explicit opt-in for promise-returning
actions that are wrapped or declared without the `async` keyword.
