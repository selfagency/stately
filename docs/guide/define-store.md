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

## Store helpers

Every store instance exposes the same helper surface:

- `$id`
- `$state`
- `$patch(...)`
- `$reset()`
- `$subscribe(...)`
- `$onAction(...)`
- `$dispose()`

Use `storeToRefs()` when you need safe destructuring for reactive properties without breaking reactivity.
