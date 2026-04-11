# Examples and recipes

Stately ships packaged examples under `src/lib/examples/` so you can inspect
patterns that match the public API exactly.

Use this page as a cookbook: each example shows a real feature combination that
users are likely to need in an app.

## What is included

- `src/lib/examples/option-store/counter.ts`
- `src/lib/examples/setup-store/preferences.svelte.ts`
- `src/lib/examples/plugins/persistence.ts`
- `src/lib/examples/plugins/history.ts`
- `src/lib/examples/plugins/sync.ts`
- `src/lib/examples/plugins/async.ts`

## Option store counter

This is the simplest example: a plain option store with state, getters, and actions.

```ts
import { defineStore } from '@selfagency/stately';

export const useCounterStore = defineStore('example-option-counter', {
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

## Setup store preferences

Setup stores are useful when you want to use Svelte runes directly to manage reactive state with explicit control over reads and writes.

```ts
import { defineStore } from '@selfagency/stately';

export const usePreferencesStore = defineStore('example-setup-preferences', {
	setup: () => {
		const preferences = $state({
			theme: 'light' as 'light' | 'dark',
			compact: false
		});

		return {
			get theme() {
				return preferences.theme;
			},
			get compact() {
				return preferences.compact;
			},
			toggleTheme() {
				preferences.theme = preferences.theme === 'light' ? 'dark' : 'light';
			},
			setCompact(value: boolean) {
				preferences.compact = value;
			}
		};
	}
});
```

## Persisted preferences

This example shows how to persist a user preference store while keeping SSR safe.

```ts
import {
	createLocalStorageAdapter,
	createLzStringCompression,
	createMemoryStorageAdapter,
	createPersistencePlugin,
	createStateManager,
	defineStore
} from '@selfagency/stately';

const fallbackAdapter = createMemoryStorageAdapter();

const safeLocalStorageAdapter = {
	getItem(key: string) {
		return typeof localStorage === 'undefined'
			? fallbackAdapter.getItem(key)
			: createLocalStorageAdapter().getItem(key);
	},
	setItem(key: string, value: string) {
		return typeof localStorage === 'undefined'
			? fallbackAdapter.setItem(key, value)
			: createLocalStorageAdapter().setItem(key, value);
	},
	removeItem(key: string) {
		return typeof localStorage === 'undefined'
			? fallbackAdapter.removeItem(key)
			: createLocalStorageAdapter().removeItem(key);
	}
};

export const usePreferencesStore = defineStore('example-plugin-persistence', {
	state: () => ({ theme: 'dark', compact: false }),
	persist: {
		adapter: safeLocalStorageAdapter,
		key: 'stately:examples:persistence',
		version: 1,
		compression: createLzStringCompression()
	}
});

export const persistenceManager = createStateManager().use(createPersistencePlugin());
```

## Undo and redo for drafts

History is a good fit for draft editors and other state that benefits from time travel.

```ts
import { createHistoryPlugin, createStateManager, defineStore } from '@selfagency/stately';

export const useDraftStore = defineStore('example-plugin-history', {
	state: () => ({ count: 0 }),
	history: { limit: 25 },
	actions: {
		increment() {
			this.count += 1;
		}
	}
});

export const historyManager = createStateManager().use(createHistoryPlugin());
```

The store gets `$history` and `$timeTravel`, so the UI can move backward and
forward without reimplementing the replay logic.

## Multi-tab sync

The sync example keeps a presence-style store aligned across contexts.

```ts
import { createStateManager, createSyncPlugin, defineStore } from '@selfagency/stately';

export const usePresenceStore = defineStore('example-plugin-sync', {
	state: () => ({ count: 0, originLabel: 'local tab' }),
	actions: {
		increment() {
			this.count += 1;
		}
	}
});

export const createSyncedManager = (origin: string) =>
	createStateManager().use(createSyncPlugin({ origin, channelName: 'stately-example-sync' }));
```

This pattern is useful when multiple browser tabs should act like one shared workspace.

## Async loading with cancellation

The async example shows a restartable action with `AbortSignal` injection.

```ts
import { createAsyncPlugin, createStateManager, defineStore } from '@selfagency/stately';

export const useAsyncCounterStore = defineStore('example-plugin-async', {
	state: () => ({ count: 0 }),
	actions: {
		async loadCount(signal: AbortSignal, target: number) {
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(resolve, 250);
				signal.addEventListener(
					'abort',
					() => {
						clearTimeout(timeout);
						reject(new Error('Aborted'));
					},
					{ once: true }
				);
			});

			this.count = target;
			return target;
		}
	}
});

export const asyncManager = createStateManager().use(
	createAsyncPlugin({
		include: ['loadCount'],
		policies: { loadCount: 'restartable' },
		injectSignal(signal, args) {
			return [signal, ...args];
		}
	})
);
```

## How to use the examples

- Start with the source file that matches the feature you want.
- Copy the pattern into your app instead of copying internals.
- Use the [reference](/reference/api) when you want the exact contract for a helper or plugin.
- Use the guide pages when you want the surrounding usage pattern and trade-offs.
