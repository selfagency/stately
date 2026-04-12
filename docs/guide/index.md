# Guide

This guide provides a step-by-step approach to setting up Stately, from initial installation to production-ready configurations.

The documentation is organized by task:

- Start with a single store.
- Add plugins to solve specific state challenges.
- Implement SSR-safe patterns for SvelteKit.
- Use the reference pages for detailed API contracts.

## Installation

```sh
pnpm add @selfagency/stately svelte
```

## Defining Your First Store

To get started, create a state manager and a store definition, then instantiate the store:

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

---

## Navigation by Task

### Core Concepts

- [**Defining Stores**](/guide/define-store) — Learn about option stores, setup stores, patches, and subscriptions.
- [**Examples & Recipes**](/guide/examples) — Practical, copyable patterns for common use cases.

### Adding Advanced Behavior

- [**Plugins**](/guide/plugins) — A guide to selecting and implementing plugins.
- [**State Machines (FSM)**](/guide/fsm) — Model explicit workflows and state transitions.
- [**Validation**](/guide/validation) — Ensure state consistency by rejecting invalid updates.

### SSR & SvelteKit

- [**SSR & SvelteKit**](/guide/ssr-and-sveltekit) — Best practices for request-scoped managers and avoiding memory leaks.
- [**SvelteKit Data Loading**](/guide/sveltekit-data-loading) — Hydrate stores from `load` functions safely.

### Tooling & Maintenance

- [**Inspector**](/guide/inspector) — Set up the development drawer and Vite integration.
- [**Troubleshooting**](/guide/troubleshooting) — Solutions for common implementation mistakes.
- [**Testing & Releases**](/guide/testing-and-releases) — Guidance on validation and release workflows.

### Migration

- [**Migration from Pinia**](/guide/migration-from-pinia) — A specialized guide for developers transitioning from Vue/Pinia.

---

## Documentation Strategy

- Use the **Guide** when you want to understand recommended patterns and architectural trade-offs.
- Use the [**API Reference**](/reference/api) when you need exact option shapes, function signatures, or TypeScript definitions.
