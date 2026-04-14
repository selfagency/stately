# Stately Plugin Patterns

## Table of Contents

- [Persistence](#persistence)
- [History and Time Travel](#history-and-time-travel)
- [Finite State Machines](#finite-state-machines)
- [Multi-Tab Sync](#multi-tab-sync)
- [Async Orchestration](#async-orchestration)
- [Validation](#validation)
- [Plugin Authoring](#plugin-authoring)
- [Combining Plugins](#combining-plugins)

## Persistence

### Basic Setup

```ts
import {
  createLocalStorageAdapter,
  createPersistencePlugin,
  createStateManager,
  defineStore
} from '@selfagency/stately';

const manager = createStateManager().use(createPersistencePlugin());

const useSessionStore = defineStore('session', {
  state: () => ({ theme: 'dark', token: '' }),
  persist: {
    adapter: createLocalStorageAdapter(),
    version: 1,
    key: 'stately:session'
  }
});
```

### PersistOptions Fields

- `adapter` — required: `PersistenceAdapter`
- `version` — required: finite number
- `key` — optional: defaults to store id
- `pick` — persist only listed keys
- `omit` — persist everything except listed keys
- `compression` — optional: `createLzStringCompression()`
- `serialize` / `deserialize` — custom hooks
- `migrate(state, fromVersion)` — schema migration
- `onError(error)` — failed write callback
- `debounce` — trailing-edge ms delay for writes
- `ttl` — discard persisted state older than ms

`pick` and `omit` are mutually exclusive (enforced at types and runtime).

### Selective Persistence

```ts
persist: {
  adapter: createLocalStorageAdapter(),
  version: 1,
  omit: ['token']  // persist everything except token
}
```

### Compression

```ts
import { createLzStringCompression } from '@selfagency/stately';

persist: {
  adapter: createLocalStorageAdapter(),
  version: 1,
  compression: createLzStringCompression()
}
```

### Schema Migration

```ts
persist: {
  adapter: createLocalStorageAdapter(),
  version: 2,
  migrate(state, fromVersion) {
    if (fromVersion === 1) {
      return { theme: state.theme ?? 'dark', compact: Boolean(state.compact) };
    }
    return { theme: 'dark', compact: false };
  }
}
```

`migrate` only applies with the built-in deserializer. Custom `deserialize()`
owns migration.

### TTL Expiry

```ts
persist: {
  adapter: createMemoryStorageAdapter(),
  version: 1,
  ttl: 60_000  // 1 minute
}
```

Wraps payload in timestamp envelope; discards on rehydrate if expired.

### Debounced Writes

```ts
persist: {
  adapter: createLocalStorageAdapter(),
  version: 1,
  debounce: 250  // 250ms trailing edge
}
```

### PersistController (`$persist`)

- `ready` — resolves after initial rehydration
- `flush()` — immediate write
- `rehydrate()` — re-read from storage
- `clear()` — remove stored snapshot (cancels pending debounce)
- `pause()` / `resume()` — disable/enable auto-writes

Persistence writes are suppressed during history replay.

### Available Adapters

- `createLocalStorageAdapter(storage?)` — browser localStorage
- `createSessionStorageAdapter(storage?)` — browser sessionStorage
- `createMemoryStorageAdapter()` — in-memory (tests, SSR fallback)
- `createIndexedDbAdapter(database)` — async IndexedDB-like

All browser adapters handle missing storage and `QuotaExceededError`.
`createLocalStorageAdapter()` is SSR-safe (no-ops when unavailable).

## History and Time Travel

### Basic Setup

```ts
import { createHistoryPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createHistoryPlugin());

const useDraftStore = defineStore('draft', {
  state: () => ({ body: '' }),
  history: { limit: 25 }
});
```

### HistoryController (`$history`)

- `entries` — array of `HistoryEntry`
- `currentIndex` — active snapshot index
- `canUndo` / `canRedo` — boolean flags

### TimeTravelController (`$timeTravel`)

- `undo()` — revert to previous entry
- `redo()` — advance to next entry
- `goTo(index)` — jump to specific snapshot
- `record(snapshot)` — manually add entry
- `startBatch()` / `endBatch()` — group mutations into one entry

### Batch Operations

```ts
const draft = useDraftStore(manager);
draft.$timeTravel.startBatch();
draft.$patch({ body: 'part 1' });
draft.$patch({ body: 'part 1 + part 2' });
draft.$timeTravel.endBatch();
// One history entry for both patches
```

Time travel suppresses persistence and sync side effects.

## Finite State Machines

### Basic Setup

```ts
import { createFsmPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createFsmPlugin());

const useCheckoutStore = defineStore('checkout', {
  state: () => ({ total: 0, errorMessage: '' }),
  fsm: {
    initial: 'idle',
    states: {
      idle: { begin: 'editing' },
      editing: { submit: 'submitting', cancel: 'idle' },
      submitting: { success: 'success', fail: 'error' },
      error: { retry: 'submitting', reset: 'editing' },
      success: {}
    }
  }
});
```

### FsmController (`$fsm`)

- `current` — active state name
- `send(event, ...args)` — trigger transition, returns new state
- `matches(...states)` — check if current state matches
- `can(event)` — check if event is valid from current state

### Lifecycle Hooks

States support `_enter` and `_exit` hooks:

```ts
states: {
  editing: {
    _enter(ctx) { console.log('Entered from:', ctx.from); },
    submit: 'submitting'
  },
  submitting: {
    _exit(ctx) { console.log('Leaving due to:', ctx.event); },
    success: 'success',
    fail: 'error'
  }
}
```

Hook context: `{ from, to, event, args }`.

### Dynamic Transitions

Event handlers can be functions returning target state or `undefined`
(stay in current):

```ts
submitting: {
  fail(message: string) {
    return message.includes('retryable') ? 'error' : undefined;
  }
}
```

### FSM Integration

FSM state stored in `__stately_fsm` internal key. History, persistence,
and sync observe transitions automatically. Always use `$fsm.current` and
`$fsm.send()` — never mutate the internal field.

## Multi-Tab Sync

### Basic Setup

```ts
import { createStateManager, createSyncPlugin, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createSyncPlugin({ origin: 'tab-1', channelName: 'my-sync' }));
```

### Sync Options

- `origin` — identifies current tab/instance
- `version` — reject incompatible payloads
- `channelName` / `storageKey` — customize transport
- `transports` — custom publish/subscribe bridge
- `createId` — per-origin monotonic mutation ids
- `createTimestamp` — for deterministic tests

### Conflict Resolution

Ordering policy (deterministic):

1. Newer `timestamp` wins
2. If timestamps match: origin name order breaks tie
3. If origin matches: higher `mutationId` wins

Behaviors:

- Ignores self-originated messages
- Rejects mismatched versions
- Only patches known state keys
- Cleans up transports during `$dispose()`

## Async Orchestration

### Basic Setup

```ts
import { createAsyncPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(
  createAsyncPlugin({
    include: ['fetchData'],
    policies: { fetchData: 'restartable' },
    injectSignal(signal, args) {
      return [signal, ...args];
    }
  })
);

const useDataStore = defineStore('data', {
  state: () => ({ data: null }),
  actions: {
    async fetchData(signal: AbortSignal, id: string) {
      const res = await fetch(`/api/data/${id}`, { signal });
      this.data = await res.json();
    }
  }
});
```

### Concurrency Policies

- `parallel` — let every invocation run
- `restartable` — cancel current when new starts
- `drop` — ignore new while one active
- `enqueue` — run sequentially
- `dedupe` — reuse active in-flight request

### AsyncActionRegistry (`$async`)

Keyed by action name. Each entry tracks loading/error state.

### Signal Injection

`injectSignal(signal, args)` must return the new args array with the
signal placed where the action expects it. Without this, cancellation
does nothing.

### Include Option

`include` limits which actions are tracked. Also explicitly opts in
promise-returning actions declared without `async` keyword.

## Validation

### Basic Setup

```ts
import { createStateManager, createValidationPlugin, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createValidationPlugin());

const useProfileStore = defineStore('profile', {
  state: () => ({ name: '', age: 18 }),
  validate(state) {
    if (!state.name.trim()) return 'Name is required';
    if (state.age < 13) return 'Age must be at least 13';
    return true;
  },
  onValidationError(message) {
    console.error(message);
  }
});
```

### Validation Outcomes

- Return `true` or `undefined` — accept patch
- Return `false` — rollback + throw `Error('Validation failed')`
- Return string — rollback + throw `Error(message)`
- Throw from `validate()` — rollback + rethrow

`onValidationError` fires before the error is thrown (for toasts, etc.).

### When to Use

- Rule is about resulting store state
- Invalid state should auto-rollback
- Invariant must apply to every patch path

Use action guards (`$onAction` + `before()`) when the rule is about
whether an action should run, not about final state shape.

## Plugin Authoring

### `defineStateManagerPlugin()`

Type-safe plugin factory with explicit augmentation contract:

```ts
import { defineStateManagerPlugin } from '@selfagency/stately';
```

### Augmentation Points

- Augment `DefineStoreOptionsBase` for new store-definition options
- Augment `StoreCustomProperties` for new store instance properties

### Plugin Behavior

- Plugins wrap `$patch` (configurable: true on the shell)
- `$dispose()` clears internal subscriptions; plugins only need to
  clean up external resources (BroadcastChannel, timers, etc.)

## Combining Plugins

Order of `.use()` calls determines plugin application order:

```ts
const manager = createStateManager()
  .use(createPersistencePlugin())
  .use(createHistoryPlugin())
  .use(createFsmPlugin())
  .use(createSyncPlugin({ origin: 'tab-1' }))
  .use(
    createAsyncPlugin({
      include: ['fetchData'],
      policies: { fetchData: 'restartable' }
    })
  )
  .use(createValidationPlugin());
```

A store can opt into multiple plugins simultaneously:

```ts
const useStore = defineStore('combined', {
  state: () => ({ count: 0 }),
  persist: { adapter: createLocalStorageAdapter(), version: 1 },
  history: { limit: 50 },
  fsm: { initial: 'idle', states: { idle: { start: 'active' }, active: {} } },
  validate(state) {
    return state.count >= 0 || 'Count must be non-negative';
  }
});
```
