# Stately

Stately is a Pinia-inspired reactive state library for Svelte 5 runes and SvelteKit.
It gives you a familiar `defineStore()` API, direct mutation ergonomics, request-scoped managers for SSR, and opt-in plugins for persistence, history, sync, and async orchestration.

## Why Stately

Use Stately when you want one store model that scales from simple counters to product workflows with persistence, undo/redo, multi-tab coordination, and cancellable async actions.
The core runtime stays small, while plugins add advanced behavior only when you ask for it.

## Installation

Install Stately and the Svelte peer dependency with your preferred package manager:

```sh
pnpm add stately svelte
```

## Quick start

Create a manager, define a store, and instantiate that store where you need it.
The example below uses an explicit manager because that pattern also works for SSR.

```ts
import { createStateManager, defineStore } from 'stately';

const manager = createStateManager();

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

const counter = useCounterStore(manager);
counter.increment();
console.log(counter.doubleCount); // 2
```

## Core API

### Option stores

Option stores bundle `state`, `getters`, and `actions` in one object.
They are the closest match to Pinia's default mental model.

```ts
import { defineStore } from 'stately';

export const useCartStore = defineStore('cart', {
	state: () => ({ items: [] as string[] }),
	getters: {
		itemCount(state) {
			return state.items.length;
		}
	},
	actions: {
		addItem(item: string) {
			this.items.push(item);
		}
	}
});
```

### Setup stores

Setup stores let you compose state with Svelte 5 runes directly.
Use a setup-options object when you want plugin configuration on the same store definition.

```ts
import { defineStore } from 'stately';

export const usePreferencesStore = defineStore('preferences', {
	setup: () => {
		let theme = $state<'light' | 'dark'>('light');
		let compact = $state(false);

		return {
			get theme() {
				return theme;
			},
			get compact() {
				return compact;
			},
			toggleTheme() {
				theme = theme === 'light' ? 'dark' : 'light';
			},
			setCompact(value: boolean) {
				compact = value;
			}
		};
	}
});
```

### Store helpers

Every store instance exposes the same helper surface:

- `$id` — stable store identifier
- `$state` — current state snapshot proxy
- `$patch(...)` — patch via object or mutation function
- `$reset()` — reset to the initial state
- `$subscribe(...)` — observe mutations
- `$onAction(...)` — observe action lifecycle
- `$dispose()` — clean up subscriptions and plugin resources

Use `storeToRefs()` when you need safe destructuring for reactive properties.

## SSR-safe and SPA-only usage

### SSR-safe pattern for SvelteKit

Create a fresh manager per request or layout boundary and provide it through Svelte context.
This avoids leaking mutable singleton state between requests.

```ts
import {
	createHistoryPlugin,
	createPersistencePlugin,
	createStateManager,
	initializeStateManagerContext
} from 'stately';

const manager = createStateManager().use(createPersistencePlugin()).use(createHistoryPlugin());

initializeStateManagerContext(manager);
```

Then read that manager where you create stores:

```ts
import { getStateManager } from 'stately';
import { useCounterStore } from '$lib/stores/counter.js';

const counter = useCounterStore(getStateManager());
```

### SPA-only convenience

If you are building a browser-only app, `getDefaultStateManager()` gives you a shared singleton manager.
That helper is intentionally SPA-only and should not be your default pattern in SSR.

## Plugin configuration

Plugins are opt-in and attach through `createStateManager().use(...)`.
Store definitions carry typed `persist` and `history` options, while the manager decides which plugins are active.

### Persistence

Use the persistence plugin to hydrate state from storage and flush snapshots through the same store interface.
Stately exports adapters for memory, `localStorage`, `sessionStorage`, and IndexedDB-shaped backends, plus optional `lz-string` compression.

```ts
import {
	createLocalStorageAdapter,
	createLzStringCompression,
	createPersistencePlugin,
	createStateManager,
	defineStore
} from 'stately';

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

### History and time travel

History tracking records snapshots and exposes undo/redo controls.
Time travel replays snapshots through the normal patch pipeline while suppressing persistence and sync feedback loops.

```ts
import { createHistoryPlugin, createStateManager, defineStore } from 'stately';

const manager = createStateManager().use(createHistoryPlugin());

export const useDraftStore = defineStore('draft', {
	state: () => ({ count: 0 }),
	history: { limit: 25 }
});

const draft = useDraftStore(manager);
draft.$history.startBatch();
draft.count += 1;
draft.count += 1;
draft.$history.endBatch();
draft.$history.undo();
draft.$timeTravel.goTo(0);
```

### Multi-tab sync

Use the sync plugin to propagate patches between managers in separate tabs or windows.
The default transport stack uses `BroadcastChannel` with a storage-event fallback, and you can supply custom transports for tests or embedded environments.

```ts
import { createStateManager, createSyncPlugin } from 'stately';

const manager = createStateManager().use(
	createSyncPlugin({
		origin: 'checkout-tab',
		channelName: 'stately-checkout'
	})
);
```

### Async orchestration

The async plugin tracks loading, error, and completion metadata per action and supports concurrency policies such as `parallel`, `restartable`, `drop`, `enqueue`, and `dedupe`.

```ts
import { createAsyncPlugin, createStateManager, defineStore } from 'stately';

const manager = createStateManager().use(
	createAsyncPlugin({
		include: ['loadProfile'],
		policies: { loadProfile: 'restartable' },
		injectSignal(signal, args) {
			return [signal, ...args];
		}
	})
);

export const useProfileStore = defineStore('profile', {
	state: () => ({ user: null as { name: string } | null }),
	actions: {
		async loadProfile(signal: AbortSignal, userId: string) {
			const response = await fetch(`/api/users/${userId}`, { signal });
			this.user = await response.json();
		}
	}
});
```

## Packaged examples

Packaged examples live under `src/lib/examples/` and are shipped with the library build.
Use them as reference implementations for:

- option stores
- setup stores
- persistence
- history and time travel
- sync
- async orchestration

## Pinia mental model and migration notes

If you already know Pinia, the mapping is intentionally familiar:

| Pinia concept                                 | Stately equivalent                      |
| --------------------------------------------- | --------------------------------------- |
| `defineStore(id, options)`                    | `defineStore(id, options)`              |
| setup stores                                  | `defineStore(id, { setup: () => ... })` |
| direct mutation                               | direct mutation                         |
| `$patch`, `$reset`, `$subscribe`, `$onAction` | same helper names                       |
| Pinia plugin setup                            | `createStateManager().use(plugin)`      |

Key differences:

- Stately is built around Svelte 5 runes rather than Vue refs.
- SSR-safe usage prefers request-scoped managers in Svelte context.
- Persistence, history, sync, and async orchestration remain opt-in.
- Setup stores should expose reactive state through returned values and accessors that preserve reactivity.

## Testing and validation

The repository validates the library with the same commands used in CI and release review:

```sh
pnpm run check
pnpm run lint
pnpm run test
pnpm run build
```

## Development showcase

The SvelteKit page under `src/routes/+page.svelte` is the interactive showcase for manual verification and product demos.
Run it locally with:

```sh
pnpm run dev
```

## Publishing checklist

Before publishing, confirm that:

- public exports match the documented API
- packaged examples reflect the current API exactly
- SSR-safe guidance matches your SvelteKit integration pattern
- release validation commands are green

## License

A `LICENSE.md` file is present in the repository.
If you publish the package to npm, also add the matching `license` field in `package.json` so registry metadata stays complete.
