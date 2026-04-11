# Define stores

Stately supports both option stores and setup stores through the same `defineStore()` entry point.
That keeps the public API compact while letting you choose the definition style that matches the store.

## Option stores

Option stores combine `state`, `getters`, and `actions` in one definition object.
They are the closest equivalent to Pinia's default style.

```ts
import { defineStore } from '@selfagency/stately';

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

## Setup stores

Setup stores let you compose reactive state with Svelte 5 runes directly.
Use the setup-options object form when you also want typed plugin configuration on the same store.

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

Setup stores can also return class instances.
Stately resolves setup members from both own properties and the prototype chain.

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

export const useCounterStore = defineStore('counter', {
	setup: () => new CounterStore()
});
```

## Store helpers in practice

Every store instance exposes the same helper surface:

- `$id`
- `$state`
- `$patch(...)`
- `$reset()`
- `$subscribe(...)`
- `$onAction(...)`
- `$dispose()`

The helpers are designed to fit different jobs:

- Use `$patch({ ... })` when you already have a partial update object.
- Use `$patch((state) => { ... })` when you want grouped state mutations.
- Use `$subscribe()` when you need persistence, logging, or a timeline.
- Use `$onAction()` when you need to observe action start, success, or failure.
- Use `$reset()` when you want the store back at its initial state.
- Use `$dispose()` when the store should stop reacting and clean up listeners.

```ts
const unsubscribe = counter.$subscribe((mutation, state) => {
	console.log(mutation.type, state.count);
});

counter.$patch({ count: 3 });
counter.$patch((state) => {
	state.count += 1;
});

counter.$reset();
unsubscribe();
```

The store also implements the Svelte store contract:

- `subscribe()` emits the full state whenever it changes.
- `set()` replaces the current state snapshot.

Use `storeToRefs()` when you need safe destructuring for reactive properties
without breaking reactivity.

```ts
const { count, doubleCount } = storeToRefs(counter);
```

## When to choose each store shape

- Use an option store when the state model is simple and you want explicit `state`, `getters`, and `actions` blocks.
- Use a setup store when you want to compose Svelte runes directly or share plugin options from the same definition.
- Use whichever shape keeps the reactive intent easiest to read; the helper surface is the same either way.
