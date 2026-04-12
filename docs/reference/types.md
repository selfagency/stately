# Public types

Stately exports its type contracts from the package root so that plugin authors and application code
may maintain proper inference all the way through the store lifecycle —
no guesswork, no unpleasant surprises.

## Store and manager types

- `StateManager` — the runtime container that owns plugins, definitions, and store instances
- `StateManagerPlugin` — a plugin function that can augment a store instance
- `TypedStateManagerPlugin` — the stricter plugin callback type used when you
  want compile-time checking for a specific augmentation shape
- `defineStateManagerPlugin()` — helper that locks a plugin to a declared augmentation contract
- `StoreDefinition` — the callable definition returned by `defineStore()`
- `StoreInstance` — the fully materialized store type
- `StoreState`, `StoreGetters`, `StoreActions` — helper aliases used by inference

## Store hook types

- `StoreMutationContext` — payload passed to `$subscribe()` callbacks
- `StoreActionHookContext` — payload passed to `$onAction()` callbacks
- `StoreSubscribeOptions` — typed selector and equality options for `$subscribe()`

`StoreMutationContext` exposes the store id, the store instance, the mutation type, and the payload when one exists.

`StoreActionHookContext` exposes the action name, arguments, and `after()` / `onError()` hooks.

`StoreSubscribeOptions` is generic over both the store state and the selected
slice. When you provide `select`, the `equalityFn` parameters are inferred from
that selector instead of falling back to `unknown`.

## Store option augmentation

- `DefineStoreOptionsBase`
- `DefineSetupStoreOptions`
- `HistoryStoreOptions`
- `PersistStoreOptions`
- `StoreCustomProperties`
- `StoreCustomStateProperties`

These types exist so plugins can extend store definitions and store instances without losing IntelliSense.

Plugin option augmentation should prefer the existing generic hooks instead of
casting everything to `Record<string, unknown>`. For example, validation options
can now type their `state` parameter from the actual store state.

When a plugin wants stricter compile-time checking for the object it returns,
prefer `defineStateManagerPlugin()` with an explicit augmentation type rather
than returning an untyped object literal.

## Persistence types

- `PersistenceAdapter`
- `PersistOptions`
- `PersistController`
- `PersistEnvelope`
- `PersistCompression`
- `JsonPrimitive`
- `JsonObject`
- `JsonArray`
- `JsonValue`

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

### `TimeTravelController<State>`

The type exposed on `store.$timeTravel` when the history plugin is active.

| Member         | Type                         | Description                         |
| -------------- | ---------------------------- | ----------------------------------- |
| `entries`      | `HistoryEntry<State>[]`      | Full history stack, newest first    |
| `currentIndex` | `number`                     | Index of the active snapshot        |
| `isReplaying`  | `boolean`                    | `true` while `goTo()` is replaying  |
| `goTo(index)`  | `(index: number) => boolean` | Jump to a history snapshot by index |

Use `$timeTravel` when you want to render or navigate the history stack. Note that
`goTo(index)` replays a past snapshot and changes live store state — it does not,
however, record a new history entry. Reserve `$history` for undo/redo and `record()`
mutations.

`SyncMessage` is the wire format for cross-context synchronization. `mutationId`
must increase monotonically per origin, while `timestamp` participates in
cross-origin last-write-wins ordering.

`AsyncPluginOptions` controls which actions are tracked and how concurrency is
handled. `include` can also be used as an explicit opt-in for promise-returning
actions that are wrapped or declared without the `async` keyword.

`JsonObject` and `JsonValue` describe the JSON-safe payload boundary used by the
packaged persistence and sync declaration defaults.
