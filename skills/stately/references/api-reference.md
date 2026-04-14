# Stately API Reference

## Table of Contents

- [Store Creation](#store-creation)
- [State Manager](#state-manager)
- [Context Helpers](#context-helpers)
- [Store Helpers](#store-helpers)
- [Reactive Utilities](#reactive-utilities)
- [Plugin Factories](#plugin-factories)
- [Persistence Adapters](#persistence-adapters)
- [Action Helpers](#action-helpers)
- [Public Types](#public-types)

## Store Creation

### `defineStore(id, definition)`

Creates a reusable store definition. Call the returned function with a manager.

**Option store:**

```ts
import { defineStore } from '@selfagency/stately';

const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, step: 1 }),
  getters: {
    doubleCount(state) {
      return state.count * 2;
    }
  },
  actions: {
    increment() {
      this.count += this.step;
    },
    setStep(step: number) {
      this.step = step;
    }
  }
});
```

**Setup store (object):**

```ts
const usePrefsStore = defineStore('prefs', {
  setup: () => ({
    theme: 'light' as 'light' | 'dark',
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
    }
  })
});
```

**Setup store (class instance):**

```ts
class CounterStore {
  count = 0;
  get doubleCount() {
    return this.count * 2;
  }
  increment() {
    this.count += 1;
  }
}

const useCounterStore = defineStore('counter', {
  setup: () => new CounterStore()
});
```

Use `SvelteMap`, `SvelteSet`, `SvelteDate`, `SvelteURL` for reactive
collections in state.

## State Manager

### `createStateManager()`

Returns an isolated manager tracking plugins, definitions, and instances.

```ts
const manager = createStateManager();
```

Methods:

- `use(plugin)` — register a plugin (chainable)
- `register(definition)` — register without creating
- `createStore(definition, factory)` — create or reuse instance
- `getStore(id)` — return instance or `undefined`
- `hasStore(id)` / `hasDefinition(id)` — boolean checks
- `getDefinition(id)` — retrieve registered definition
- `deleteStore(id)` — dispose + remove instance and definition
- `clear()` — dispose all stores, remove all definitions
- `plugins` — readonly plugin array

### `getDefaultStateManager()`

Browser-only singleton convenience. **Throws during SSR.** SPA-only.

## Context Helpers

### `initializeStateManagerContext(manager?)`

SSR-safe: calls `setContext` internally. Must be called during component init.

```svelte
<script>
  import { createStateManager, initializeStateManagerContext } from '@selfagency/stately';

  const manager = createStateManager();
  initializeStateManagerContext(manager);
</script>
```

### `getStateManager()`

Reads the manager from Svelte context. Use downstream of
`initializeStateManagerContext`.

### `setStateManager(manager)`

Manually sets the context-level manager.

## Store Helpers

Every store instance exposes:

### `$id`

The store's unique identifier string.

### `$state`

Direct access to the reactive state object.

### `$patch(partialOrFn)`

Apply partial object or mutation function:

```ts
store.$patch({ count: 3 });
store.$patch((state) => {
  state.count += 1;
});
```

### `$reset()`

Revert to initial state factory output.

### `$subscribe(callback, options?)`

Watch mutations. Returns unsubscribe function.

```ts
const unsub = store.$subscribe(
  (mutation, state) => {
    // mutation.type: 'direct' | 'patch-object' | 'patch-function'
    // mutation.storeId, mutation.payload
  },
  {
    detached: true,
    select: (state) => state.count,
    equalityFn: (prev, next) => prev === next
  }
);
```

- `detached: true` — survives component destroy; you manage cleanup
- `select` — derive slice for equality check
- `equalityFn` — custom comparison (default: `Object.is`)

### `$onAction(callback)`

Intercept action lifecycle:

```ts
store.$onAction(({ name, args, before, after, onError }) => {
  before(() => {
    if (name === 'save' && args.length === 0) return false; // cancel
  });
  after((result) => {
    /* success */
  });
  onError((error) => {
    /* failure */
  });
});
```

### `$dispose()`

Teardown: sets disposed flag, clears all subscriptions.

### `subscribe(cb)` / `set(val)`

Svelte store contract compatibility.

## Reactive Utilities

### `storeToRefs(store)`

Convert reactive properties to `{ value }` refs for safe destructuring:

```ts
import { storeToRefs } from '@selfagency/stately';

const { count, doubleCount } = storeToRefs(counter);
// Access via count.value, doubleCount.value
```

Skips methods and `$`-prefixed helpers.

### `createExternalSubscriber(options)`

Bridge external event systems into Svelte reactivity:

```ts
import { createExternalSubscriber } from '@selfagency/stately';

const online = createExternalSubscriber({
  getSnapshot: () => navigator.onLine,
  subscribe(update) {
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }
});
// online.current is reactive
```

## Plugin Factories

### `createPersistencePlugin()`

Hydrates and flushes store state through storage adapters.

### `createHistoryPlugin()`

Records snapshots; adds `$history` and `$timeTravel`.

### `createFsmPlugin()`

Adds `$fsm` controller for stores with `fsm` definition.

### `createSyncPlugin(options?)`

Cross-tab synchronization via BroadcastChannel/storage events.

Options: `origin`, `version`, `channelName`, `storageKey`,
`transports`, `createId`, `createTimestamp`, `createMessage`.

### `createAsyncPlugin(options?)`

Tracks action state with concurrency control.

Options: `include`, `policies`, `policy`, `injectSignal`.

### `createValidationPlugin()`

Wraps `$patch` for stores with `validate` function.

## Persistence Adapters

```ts
import {
  createLocalStorageAdapter,
  createSessionStorageAdapter,
  createMemoryStorageAdapter,
  createIndexedDbAdapter,
  createLzStringCompression
} from '@selfagency/stately';
```

All adapters implement `PersistenceAdapter`:
`getItem(key)`, `setItem(key, value)`, `removeItem(key)`,
optional `clear()` and `keys()`.

Browser adapters handle missing storage and quota errors gracefully.

## Action Helpers

```ts
import { debounceAction, throttleAction } from '@selfagency/stately';
```

Wrap action functions with debounce/throttle behavior.

## Public Types

### Store and Manager

- `StateManager`, `StateManagerPlugin`, `TypedStateManagerPlugin`
- `StoreDefinition`, `StoreInstance`
- `StoreState`, `StoreGetters`, `StoreActions`
- `DefineStoreOptionsBase`, `DefineSetupStoreOptions`
- `StoreCustomProperties`, `StoreCustomStateProperties`

### Hooks

- `StoreMutationContext` — `$subscribe` payload
- `StoreActionHookContext` — `$onAction` payload
- `StoreSubscribeOptions` — typed selector/equality opts

### Persistence

- `PersistenceAdapter`, `PersistOptions`, `PersistController`
- `PersistEnvelope`, `PersistCompression`
- `JsonPrimitive`, `JsonObject`, `JsonArray`, `JsonValue`

### History, Sync, Async

- `HistoryController`, `HistoryEntry`, `TimeTravelController`
- `SyncMessage`, `SyncTransport`
- `AsyncActionRegistry`, `AsyncPluginOptions`, `ConcurrencyMode`

### FSM

- `FsmController`, `FsmDefinition`, `FsmStateDefinition`
- `FsmTransitionContext`

### Plugin Store Options

- `HistoryStoreOptions`, `PersistStoreOptions`
- `StoreRef`, `StoreRefs`

### Plugin Authoring

Use `defineStateManagerPlugin()` for compile-time checked plugins:

```ts
import { defineStateManagerPlugin } from '@selfagency/stately';
```

Augment `DefineStoreOptionsBase` for new store options,
`StoreCustomProperties` for new instance properties.

## Inspector Exports

Separate subpath: `@selfagency/stately/inspector`

- `createStatelyInspectorHook()`
- `installStatelyInspectorHook(hook)`
- `getStatelyInspectorHook()`
- `mountStatelyInspector(options?)`
- `disposeStatelyInspector()`
- `formatInspectorValue(value)`
- `reportStatelyInspectorNotice(message, level?)`
- `resetStatelyInspectorHook()`
- `InspectorDrawer` component

Vite plugin: `@selfagency/stately/inspector/vite`

```ts
import { statelyVitePlugin } from '@selfagency/stately/inspector/vite';

statelyVitePlugin({
  buttonPosition: 'right-bottom',
  panelSide: 'right'
});
```

Options: `enabled`, `buttonPosition`, `panelSide`.

## Testing Export

Subpath: `@selfagency/stately/testing`

Provides test utilities for store testing workflows.
