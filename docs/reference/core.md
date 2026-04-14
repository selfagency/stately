# Core runtime

The core runtime is the foundation of Stately: a small, SSR-aware surface that everything else builds on.
It covers store creation, manager lifecycles, store helpers, Svelte interop,
and the bridge for external reactive systems.

## `defineStore(id, definition)`

`defineStore()` creates a reusable store definition.
Call the returned function with a manager to create or retrieve the store instance.

It supports both option stores and setup stores:

```ts
import { defineStore } from '@selfagency/stately';

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount(state) {
      return state.count * 2;
    }
  },
  actions: {
    increment() {
      this.count += 1;
    }
  }
});
```

Option-store `state()` must return a plain object at runtime. Stately rejects
common non-plain shapes such as arrays, `Date`, `Map`, `Set`, and promises at
compile time for option stores, but the runtime shell still performs the final
prototype check when the store is created.

If your state includes `Map`, `Set`, `Date`, or URL-like primitives, prefer
Svelte reactive built-ins (`SvelteMap`, `SvelteSet`, `SvelteDate`, `SvelteURL`)
to keep updates predictable.

```ts
import { defineStore } from '@selfagency/stately';

export const usePreferencesStore = defineStore('preferences', {
  setup: () => ({
    theme: 'light' as 'light' | 'dark',
    compact: false,
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
    },
    setCompact(value: boolean) {
      this.compact = value;
    }
  })
});
```

Class-based setup stores are also supported:

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

For both store styles, `$state` and `$patch()` are typed to expose only data
properties. In option stores this follows naturally from the separate `state`,
`getters`, and `actions` sections. In setup stores, Stately automatically
filters function-valued properties out of `$state` and `$patch()` so they only
contain the non-function members of the setup return value — the same
properties you see as live state on the store instance.

Use `defineStore()` when you want one store identity that can be shared across components and plugins.
In SSR, instantiate the store through a request-scoped manager rather than relying on a singleton.

## `createStateManager()`

`createStateManager()` returns an isolated manager that tracks plugins, store definitions, and created store instances.

Use it when you want an app-scoped or request-scoped container for stores:

```ts
import { createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager();
const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 })
});

const counter = useCounterStore(manager);
```

Useful manager methods:

- `use(plugin)` registers a plugin before stores are created.
- `register(definition)` adds a store definition without creating an instance.
- `createStore(definition, factory)` creates or reuses a store instance.
- `getStore(id)` returns a created store if one exists, or `undefined`.
- `hasStore(id)` returns `true` if an instance has been created for that id.
- `hasDefinition(id)` returns `true` if a definition has been registered under that id.
- `getDefinition(id)` retrieves the registered `StoreDefinition` for an id.
- `deleteStore(id)` disposes the current instance through `$dispose()`, then removes both the
  instance and its definition. A new call to `useMyStore(manager)` will re-create it from scratch.
- `clear()` disposes all active stores and removes all definitions and instances.
- `plugins` is the readonly array of plugins registered on this manager.

## `getDefaultStateManager()`

`getDefaultStateManager()` is a browser-only convenience for SPA usage.
It throws during SSR, so do not use it as your default integration path in SvelteKit.

```ts
import { getDefaultStateManager } from '@selfagency/stately';

const manager = getDefaultStateManager();
```

## `initializeStateManagerContext(manager?)`

`initializeStateManagerContext()` is the SSR-safe helper for creating or
providing a request-scoped manager through Svelte context.

Use it from a layout or component boundary that should own the manager for the current request:

```ts
import { createStateManager, createPersistencePlugin, initializeStateManagerContext } from '@selfagency/stately';

const manager = createStateManager().use(createPersistencePlugin());
initializeStateManagerContext(manager);
```

`getStateManager()` and `setStateManager()` are the corresponding context accessors.

## `storeToRefs(store)`

`storeToRefs()` converts reactive store properties into `{ value }` refs so you can destructure safely without losing reactivity.

```ts
import { storeToRefs } from '@selfagency/stately';

const counter = useCounterStore(manager);
const { count, doubleCount } = storeToRefs(counter);
```

It skips methods and `$`-prefixed shell helpers, so it is safe to use on full store instances.
State and getter refs preserve the concrete property types from the source
store instead of degrading to `unknown`.

## Store helper surface

Every store instance exposes the same shell helpers:

- `$id` for the store identifier
- `$state` for reading or replacing state snapshots
- `$patch(...)` for object patches or mutation functions
- `$reset()` for restoring the initial state
- `$subscribe(...)` for mutation notifications
- `$onAction(...)` for action hooks
- `$dispose()` for teardown
- `subscribe(...)` / `set(...)` for Svelte store interop

`$subscribe()` callback signature:

```ts
store.$subscribe((mutation, state) => {
  // mutation.type => 'direct' | 'patch-object' | 'patch-function'
  // mutation.storeId => current store id
  // mutation.payload => commit metadata and optional payload
  // state => latest store state snapshot/proxy
});
```

`$subscribe()` accepts an optional second argument with lifecycle options:

```ts
const unsubscribe = store.$subscribe(callback, { detached: true });
```

- `detached: true` — the subscription **will not** be automatically cleaned up when the enclosing
  Svelte component is destroyed. You are responsible for calling the returned `unsubscribe` function.
  Use this when subscribing from outside a component, or when the subscription must outlive the
  component (e.g. plugins, devtools adapters, test harnesses).
- When `detached` is omitted or `false`, `$subscribe` registers an `onDestroy` handler so the
  subscription is torn down automatically with the component.

`$subscribe()` also supports selective subscriptions:

```ts
store.$subscribe(callback, {
  detached: true,
  select: (state) => state.count,
  equalityFn: (prev, next) => prev === next
});
```

- `select` derives the value that should drive subscription equality
- `equalityFn` overrides the default `Object.is` comparison for that selected
  value

`$onAction()` exposes action lifecycle hooks:

```ts
store.$onAction(({ name, args, before, after, onError }) => {
  before(() => {
    if (name === 'save' && args.length === 0) {
      return false;
    }
  });

  after((result) => {
    console.log('completed with', result);
  });

  onError((error) => {
    console.error(error);
  });
});
```

If a `before()` guard returns `false`, the action is cancelled.

Practical rules:

- Use direct mutation inside actions when you want the normal mutation pipeline.
- Use `$patch({ ... })` when you already have a partial object.
- Use `$patch((state) => { ... })` when you need a grouped mutation.
- Use `$subscribe()` for persistence, logging, or timelines.
- Use `$onAction()` when you need to observe action start/success/failure.
- Use `before()` inside `$onAction()` when an action should be cancelled before
  it mutates state.

## `createExternalSubscriber()`

`createExternalSubscriber()` bridges external event systems into Svelte reactivity.
Provide a snapshot reader and a subscribe function, and it gives you a
reactive `current` getter plus an `unsubscribe()` cleanup method.

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
```

Use it when you want external browser state to participate in Svelte
reactivity without inventing a custom store wrapper.
