# Stately

Stately is a Pinia-inspired reactive state library for Svelte 5 runes and SvelteKit. It gives you a familiar
`defineStore()` API, direct mutation ergonomics, request-scoped managers for SSR, and opt-in plugins for persistence,
history, sync, and async orchestration.

<!-- markdownlint-disable MD033 -->
<p align="center">
  <img src="./stately.svg" alt="Stately logo" width="220" />
</p>
<!-- markdownlint-enable MD033 -->

## Read the docs

The full documentation lives at [`stately.self.agency`](https://stately.self.agency/).

- [Guide](https://stately.self.agency/guide/) — install the package, define stores, use SSR-safe managers, and configure
  plugins.
- [API reference](https://stately.self.agency/reference/api) — browse the exported runtime surface.
- [Migration from Pinia](https://stately.self.agency/guide/migration-from-pinia) — map familiar Pinia patterns to Stately.
- [Testing and releases](https://stately.self.agency/guide/testing-and-releases) — contributor workflows, hooks, and
  release automation.

## Quick summary

Use Stately when you want one store model that scales from simple counters to product workflows with persistence,
undo/redo, time travel, multi-tab coordination, and cancellable async actions. The core runtime stays small, while plugins
add advanced behavior only when you ask for it.

## Install

```sh
pnpm add @selfagency/stately svelte
```

## Tiny example

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

## In this repository

- `src/lib/` contains the package source.
- `src/lib/examples/` contains packaged usage examples.
- `src/routes/+page.svelte` is the interactive showcase app.
- `docs/` contains the VitePress documentation site.

## Local docs development

```sh
pnpm run docs:dev
```

## Validation

```sh
pnpm run check
pnpm run lint
pnpm run test
pnpm run build
```
