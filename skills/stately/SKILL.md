---
name: stately
description: >
  Implement and manage Stately stores — the Pinia-inspired Svelte 5 state management library
  (@selfagency/stately). Use when creating defineStore() option or setup stores, configuring
  plugins (persistence, history, FSM, sync, async, validation), wiring SSR-safe managers in
  SvelteKit, using storeToRefs(), $patch, $subscribe, $onAction, or any Stately API. Also use
  when debugging store reactivity, choosing concurrency policies, modeling finite state machines,
  adding time-travel, or building custom Stately plugins. Triggers on: "create a store",
  "add persistence", "add history/undo/redo", "sync across tabs", "finite state machine",
  "async plugin", "validation plugin", "SSR-safe store", "SvelteKit data loading with stores",
  "storeToRefs", "$patch", "$subscribe", "defineStore", "createStateManager", "stately".
---

# Stately — Svelte 5 State Management

Stately is a Pinia-inspired state library for Svelte 5 and SvelteKit. It provides `defineStore()` with option and setup stores, SSR-safe managers, and opt-in plugins for persistence, history, FSM, sync, async, and validation.

Package: `@selfagency/stately`

## Quick Start

```ts
import { createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager();

const useCounterStore = defineStore('counter', {
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

const counter = useCounterStore(manager);
counter.increment();
```

## Store Styles

**Option store** — `state`, `getters`, `actions` in a config object:

```ts
defineStore('id', {
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

**Setup store** — return an object or class instance:

```ts
defineStore('id', {
	setup: () => ({
		theme: 'light' as 'light' | 'dark',
		toggleTheme() {
			this.theme = this.theme === 'light' ? 'dark' : 'light';
		}
	})
});
```

Setup stores support class instances with prototype getters/methods resolved automatically.

## Store Helpers

Every store instance exposes:

| Helper                       | Purpose                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `$id`                        | Store identifier                                                 |
| `$state`                     | Direct state access                                              |
| `$patch(obj \| fn)`          | Partial update or grouped mutation                               |
| `$reset()`                   | Revert to initial state                                          |
| `$subscribe(cb, opts?)`      | Watch mutations; supports `select` and `equalityFn`              |
| `$onAction(cb)`              | Intercept actions; `before()` guard can return `false` to cancel |
| `$dispose()`                 | Teardown and cleanup                                             |
| `subscribe(cb)` / `set(val)` | Svelte store contract                                            |

Use `storeToRefs(store)` to destructure reactive properties safely.

## Plugin System

Attach plugins to a manager, opt stores in via definition options:

```ts
const manager = createStateManager()
	.use(createPersistencePlugin())
	.use(createHistoryPlugin())
	.use(createFsmPlugin())
	.use(createSyncPlugin({ origin: 'tab-1' }))
	.use(createAsyncPlugin({ include: ['fetchData'], policies: { fetchData: 'restartable' } }))
	.use(createValidationPlugin());
```

Each plugin only affects stores that declare the matching option (`persist`, `history`, `fsm`, `validate`).

### Plugin Quick Reference

| Plugin                      | Store Option | Controller                 | Key Features                                             |
| --------------------------- | ------------ | -------------------------- | -------------------------------------------------------- |
| `createPersistencePlugin()` | `persist`    | `$persist`                 | Adapters, compression, pick/omit, TTL, migrate, debounce |
| `createHistoryPlugin()`     | `history`    | `$history` / `$timeTravel` | undo/redo, goTo, batch, time-travel                      |
| `createFsmPlugin()`         | `fsm`        | `$fsm`                     | send, matches, can, lifecycle hooks                      |
| `createSyncPlugin(opts)`    | —            | —                          | BroadcastChannel, storage fallback, conflict ordering    |
| `createAsyncPlugin(opts)`   | —            | `$async`                   | parallel/restartable/drop/enqueue/dedupe, AbortSignal    |
| `createValidationPlugin()`  | `validate`   | —                          | Rollback on failure, onValidationError callback          |

## SSR Safety (Critical)

In SvelteKit, create a **fresh manager per request** via Svelte context:

```svelte
<!-- +layout.svelte -->
<script>
	import { createStateManager, initializeStateManagerContext } from '@selfagency/stately';
	const manager = createStateManager();
	initializeStateManagerContext(manager);
</script>
```

Read with `getStateManager()` downstream. **Never use `getDefaultStateManager()` on the server** — it leaks state between requests.

Guard browser-only adapters:

```ts
import { browser } from '$app/environment';
persist: {
  adapter: browser ? createLocalStorageAdapter() : createMemoryStorageAdapter(),
  version: 1
}
```

## Reference Files

For detailed patterns, read these files as needed:

- **[references/api-reference.md](references/api-reference.md)** — Full API surface: all exports, type signatures, controller shapes, and store option contracts.
- **[references/plugin-patterns.md](references/plugin-patterns.md)** — Detailed plugin configuration: persistence adapters, history batching, FSM definitions, sync transports, async concurrency, validation, and plugin authoring.
- **[references/ssr-patterns.md](references/ssr-patterns.md)** — SSR-safe patterns: SvelteKit data loading, hydration, browser guards, and request-scoped managers.

## Key Rules

1. Files using `$state`, `$derived`, `$effect` runes must be `.svelte.ts` — plain `.ts` for non-rune helpers
2. Use `$state.snapshot()` for serialization; use `structuredClone($state.snapshot(x))` for true immutable snapshots
3. Destructuring store properties breaks reactivity — use `storeToRefs()` instead
4. Time-travel replay suppresses persistence and sync side effects intentionally
5. `$dispose()` clears all internal subscriptions; plugins only need to clean up external resources
6. Selective subscriptions (`select` + `equalityFn`) reduce unnecessary callback firing
7. `before()` guard in `$onAction` returning `false` cancels the action
8. `pick` and `omit` on persistence options are mutually exclusive
9. Async `injectSignal` must be configured for `AbortSignal` to reach the action
10. FSM state stored in `__stately_fsm` internal field — always use `$fsm.current` / `$fsm.send()`
