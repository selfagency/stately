# Examples and Recipes

Stately includes a collection of practical examples under `src/lib/examples/`. These examples demonstrate how to
implement core features and plugin combinations using the public API.

## Available Examples

The following patterns are available in the repository:

- **Option Store:** `src/lib/examples/option-store/counter.ts`
- **Setup Store:** `src/lib/examples/setup-store/preferences.svelte.ts`
- **Persistence:** `src/lib/examples/plugins/persistence.ts`
- **History:** `src/lib/examples/plugins/history.ts`
- **Multi-tab Sync:** `src/lib/examples/plugins/sync.ts`
- **Async Logic:** `src/lib/examples/plugins/async.ts`
- **Finite State Machine:** `src/lib/examples/plugins/fsm.ts`

---

## Option Store (Counter)

A standard implementation using `state`, `getters`, and `actions`.

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

## Setup Store (Preferences)

Use a setup store when you want direct control over reactivity using Svelte 5 runes.

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

## Persisted State

This pattern demonstrates how to persist store state to `localStorage` with optional compression. For SSR-safe
configurations, see the [SvelteKit Guide](/guide/ssr-and-sveltekit).

```ts
import {
	createLocalStorageAdapter,
	createLzStringCompression,
	createPersistencePlugin,
	createStateManager,
	defineStore
} from '@selfagency/stately';

export const usePreferencesStore = defineStore('example-plugin-persistence', {
	state: () => ({ theme: 'dark', compact: false }),
	persist: {
		adapter: createLocalStorageAdapter(),
		key: 'stately:store:prefs',
		version: 1,
		compression: createLzStringCompression()
	}
});

export const persistenceManager = createStateManager().use(createPersistencePlugin());
```

## History and Time Travel

The history plugin is ideal for features like draft editors that require undo/redo functionality.

```ts
import { createHistoryPlugin, createStateManager, defineStore } from '@selfagency/stately';

export const useDraftStore = defineStore('example-plugin-history', {
	state: () => ({ content: '' }),
	history: { limit: 25 },
	actions: {
		updateContent(text: string) {
			this.content = text;
		}
	}
});

export const historyManager = createStateManager().use(createHistoryPlugin());
```

## Multi-tab Synchronization

Sync state across different browser contexts (tabs or windows) using the Sync plugin.

```ts
import { createStateManager, createSyncPlugin, defineStore } from '@selfagency/stately';

export const usePresenceStore = defineStore('example-plugin-sync', {
	state: () => ({ count: 0 }),
	actions: {
		increment() {
			this.count += 1;
		}
	}
});

export const createSyncedManager = (origin: string) =>
	createStateManager().use(createSyncPlugin({ origin, channelName: 'stately-sync' }));
```

## Async Operations with Cancellation

Manage async actions with built-in concurrency policies like `restartable` and automatic `AbortSignal` injection.

```ts
import { createAsyncPlugin, createStateManager, defineStore } from '@selfagency/stately';

export const useAsyncStore = defineStore('example-plugin-async', {
	state: () => ({ data: null }),
	actions: {
		async fetchData(signal: AbortSignal, id: string) {
			const response = await fetch(`/api/data/${id}`, { signal });
			this.data = await response.json();
		}
	}
});

export const asyncManager = createStateManager().use(
	createAsyncPlugin({
		include: ['fetchData'],
		policies: { fetchData: 'restartable' },
		injectSignal: (signal, args) => [signal, ...args]
	})
);
```

## Finite State Machine (FSM)

Use the FSM plugin to define explicit states and valid transitions for complex workflows.

```ts
import { createFsmPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createFsmPlugin());

export const useWizardStore = defineStore('wizard', {
	state: () => ({ step: 1 }),
	fsm: {
		initial: 'editing',
		states: {
			editing: { next: 'review' },
			review: { back: 'editing', submit: 'submitted' },
			submitted: {}
		}
	}
});

const wizard = useWizardStore(manager);

// Use the FSM controller to trigger transitions
wizard.$fsm.send('next');

// Check the current state
if (wizard.$fsm.matches('review')) {
	// Proceed to the review step
}
```

## State Validation

The validation plugin automatically rolls back patches if they fail to meet defined criteria.

```ts
import { createStateManager, createValidationPlugin, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createValidationPlugin());

export const useProfileStore = defineStore('profile', {
	state: () => ({ name: '', age: 18 }),
	validate(state) {
		return state.name.trim() ? true : 'Name is required';
	}
});
```

## Usage Tips

- **Implementation:** Copy these patterns into your project as a starting point.
- **Reference:** Check the [API Reference](/reference/api) for detailed type definitions.
- **Concepts:** Review the [Guide](/guide/) for deeper explanations of trade-offs and best practices.
