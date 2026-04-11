# Guide

Stately gives you a Pinia-style store API adapted for Svelte 5 runes and SvelteKit.
Use this guide to get from install to production-ready store patterns quickly.

If you already know the basics, the most useful next reads are
[Define stores](/guide/define-store), [Plugins](/guide/plugins), and
[Examples and recipes](/guide/examples).

## Install the package

Install the package and the Svelte peer dependency:

```sh
pnpm add @selfagency/stately svelte
```

## Define your first store

Create a manager and a store definition, then instantiate the store from that manager:

```ts
import { createStateManager, defineStore } from '@selfagency/stately';

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
```

## What to read next

- [Define stores](/guide/define-store) for option stores, setup stores, and store helpers.
- [SSR and SvelteKit](/guide/ssr-and-sveltekit) for request-scoped manager patterns.
- [Plugins](/guide/plugins) for persistence, history, sync, and async orchestration.
- [Examples and recipes](/guide/examples) for advanced usage patterns you can copy into real stores.
- [Testing and releases](/guide/testing-and-releases) for local validation and release automation.
