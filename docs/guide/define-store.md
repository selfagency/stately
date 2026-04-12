# Defining Stores

Stately supports two primary patterns for defining stores through the `defineStore()` function. Both provide the same
public API, allowing you to choose the style that best fits your project's needs.

## Option Stores

Option stores organize `state`, `getters`, and `actions` into a single configuration object.
This is the closest equivalent to the standard Pinia style.

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

## Setup Stores

Setup stores allow you to compose reactive state using Svelte 5 runes directly. This is useful when you want to utilize
custom logic or share typed plugin configurations within the store definition.

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

Setup stores can also return class instances. Stately resolves members from both the instance properties and the
prototype chain.

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

## Store API & Helpers

Every store instance provides a consistent set of built-in helpers:

- `$id`: The unique identifier of the store.
- `$state`: Direct access to the state object.
- `$patch()`: Apply partial updates or grouped mutations.
- `$reset()`: Revert the store to its initial state.
- `$subscribe()`: Watch for state changes.
- `$onAction()`: Intercept or observe action execution.
- `$dispose()`: Stop reactivity and clean up listeners.

### Usage Examples

```ts
const unsubscribe = counter.$subscribe((mutation, state) => {
	console.log(mutation.type, state.count);
});

// Patch with an object
counter.$patch({ count: 3 });

// Patch with a function for grouped mutations
counter.$patch((state) => {
	state.count += 1;
});

counter.$reset();
unsubscribe();
```

Stately stores also implement the **Svelte store contract**:

- `subscribe()` emits the full state on every change.
- `set()` replaces the current state snapshot.

Use `storeToRefs()` when you need to destructure properties from a store while maintaining reactivity.

```ts
const { count, doubleCount } = storeToRefs(counter);
```

## Selective Subscriptions

By default, `$subscribe()` observes every mutation. You can optimize this by providing a selector to only fire the
callback when a specific slice of state changes.

```ts
const unsubscribe = counter.$subscribe(
	(_mutation, state) => {
		console.log('count changed to', state.count);
	},
	{
		detached: true,
		select: (state) => state.count
	}
);
```

You can also provide a custom `equalityFn` for complex data types:

```ts
store.$subscribe(callback, {
	select: (state) => state.items,
	equalityFn: (prev, next) => prev.length === next.length && prev.every((v, i) => v === next[i])
});
```

## Action Hooks and Guards

`$onAction()` allows you to react to actions and even intercept them before they run using the `before()` hook.

```ts
store.$onAction(({ args, before }) => {
	before(() => {
		const amount = args[0] as number;
		if (amount > 10) {
			return false; // Cancels the action
		}
	});
});
```

- Returning `false` from a `before()` guard cancels the action.
- Cancelled actions return `undefined` and do not trigger `after()` or `onError()` hooks.

## Choosing a Store Style

- **Option Stores:** Best for simple state models where clear separation of state, getters, and actions is preferred.
- **Setup Stores:** Best for complex logic, direct use of Svelte runes, or stores that require specific plugin configurations.

## Related Documentation

- [Plugins](/guide/plugins)
- [Validation](/guide/validation)
- [SSR and SvelteKit](/guide/ssr-and-sveltekit)
- [Core Runtime Reference](/reference/core)
