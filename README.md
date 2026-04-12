# Stately

[![CI](https://github.com/selfagency/stately/actions/workflows/ci.yml/badge.svg)](https://github.com/selfagency/stately/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/selfagency/stately/graph/badge.svg?token=9F7ZcOIrh1)](https://codecov.io/gh/selfagency/stately)

Stately is a Pinia-inspired state management library built specifically for Svelte 5 runes and SvelteKit. It provides a familiar `defineStore()` API, direct mutation ergonomics, and SSR-safe patterns, with an extensible plugin system for advanced features.

If you’ve used Pinia, you’ll feel at home. Stately provides a structured way to define shared state, mutate it directly, and observe changes. It includes built-in support for persistence, history, synchronization, and async orchestration without the boilerplate of manual state management.

<!-- markdownlint-disable MD033 -->
<p align="center">
  <img src="./stately.svg" alt="Stately logo" width="220" />
</p>
<!-- markdownlint-enable MD033 -->

## Why Stately?

Stately is designed for those that need a store model that scales from simple counters to complex application workflows while maintaining Svelte 5 semantics and avoiding SSR pitfalls.

It bridges the gap between simple writable stores and complex state frameworks, offering an API that is powerful yet intuitive.

### Key Features

- **Flexible Definitions:** `defineStore()` supporting both **option stores** and **setup stores**.
- **Intuitive API:** Direct mutations plus `$patch()`, `$reset()`, `$subscribe()`, and `$onAction()`.
- **SSR Ready:** Request-scoped state managers designed for SvelteKit safety.
- **Persistence:** Support for `localStorage`, `sessionStorage`, IndexedDB, and custom serializers with TTL and compression.
- **History:** Built-in undo, redo, and time-travel debugging.
- **Finite State Machines:** Manage complex UI logic with transitions and lifecycle hooks.
- **Multi-tab Sync:** Synchronize state across tabs using `BroadcastChannel`.
- **Async Workflow:** Track loading/error states with built-in concurrency policies (restartable, drop, enqueue, etc.).
- **Validation:** Prevent invalid state updates with pre-commit validation.
- **DevTools:** A dedicated inspector drawer and Vite integration for real-time debugging.

## Installation

```sh
pnpm add @selfagency/stately svelte
```

## Quick Start

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

**Note for SvelteKit:** When using SSR, avoid `getDefaultStateManager()`. Instead, create a request-scoped manager and provide it via Svelte context. See the [SSR documentation](https://stately.self.agency/guide/ssr-and-sveltekit) for details.

## The Inspector

Stately includes a development-only inspector that allows you to visualize your state, track mutations in real-time, and test history playback.

Enable it in your `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { statelyVitePlugin } from '@selfagency/stately/inspector/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		statelyVitePlugin({
			buttonPosition: 'right-bottom',
			panelSide: 'right'
		})
	]
});
```

## Advanced Usage

Stately is built for real-world complexity. You can easily compose plugins to handle persistence, history, and sync in a single store:

```ts
import {
	createAsyncPlugin,
	createHistoryPlugin,
	createPersistencePlugin,
	createStateManager,
	createSyncPlugin
} from '@selfagency/stately';

const manager = createStateManager()
	.use(createPersistencePlugin())
	.use(createHistoryPlugin())
	.use(createSyncPlugin({ origin: 'app-instance' }))
	.use(createAsyncPlugin());
```

For complex workflows, use the Finite State Machine (FSM) plugin to replace "boolean soup" with explicit states:

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

// Check current state
console.log(wizard.$fsm.current); // 'editing'

// Transition to the next state
wizard.$fsm.send('next');
console.log(wizard.$fsm.matches('review')); // true
```

## Examples & Resources

The repository includes several practical examples under `src/lib/examples/`:

- **Counter:** Simple option store usage.
- **Preferences:** Setup store using Svelte runes.
- **Persistence:** SSR-safe storage with compression.
- **History:** Time-travel and undo/redo setup.
- **Async:** Request cancellation and concurrency management.
- **FSM:** Manage complex workflows and validation.

## Documentation

Visit [stately.self.agency](https://stately.self.agency/) for the full documentation:

- [**Getting Started**](https://stately.self.agency/guide/) — Core concepts and patterns.
- [**Defining Stores**](https://stately.self.agency/guide/define-store) — Options, setup stores, and subscriptions.
- [**Plugins**](https://stately.self.agency/guide/plugins) — Extending functionality.
- [**SSR & SvelteKit**](https://stately.self.agency/guide/ssr-and-sveltekit) — Best practices for server-side rendering.
- [**Migration from Pinia**](https://stately.self.agency/guide/migration-from-pinia) — A guide for Vue developers.
- [**API Reference**](https://stately.self.agency/reference/api) — Full technical details.

## AI Agent Skill

Stately ships an AI agent skill that helps LLM coding agents (Cursor, Windsurf, GitHub Copilot, etc.) work with the library correctly. See the [AI Agent Skill guide](https://stately.self.agency/guide/ai-agent-skill) for setup instructions.
