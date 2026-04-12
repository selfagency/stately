# SSR and SvelteKit

Stately is designed to work with SvelteKit SSR safely, but the safety comes from how you create managers.
The recommended pattern is request-scoped manager creation plus Svelte context.

## SSR-safe pattern

Create a fresh manager inside a **component or layout `<script>` block** and provide it through
context. `initializeStateManagerContext` calls `setContext` internally, so it **must be called
during component initialization** — not in a plain `.ts` module or a `load` function.

```svelte
<!-- +layout.svelte -->
<script>
	import {
		createHistoryPlugin,
		createPersistencePlugin,
		createStateManager,
		initializeStateManagerContext
	} from '@selfagency/stately';

	// Called inside component init so that setContext works on both server and client.
	const manager = createStateManager().use(createPersistencePlugin()).use(createHistoryPlugin());
	initializeStateManagerContext(manager);
</script>
```

Read that manager where you instantiate stores:

```ts
import { getStateManager } from '@selfagency/stately';
import { useCounterStore } from '$lib/stores/counter.js';

const counter = useCounterStore(getStateManager());
```

The important rule is that each SSR request gets its own manager.
That keeps store state isolated and prevents one user’s data from leaking into
another user’s render.

## Browser-only convenience

`getDefaultStateManager()` is a browser-only convenience for SPA code.
Use it only when the app is not rendering through SSR.

```ts
import { getDefaultStateManager } from '@selfagency/stately';

const manager = getDefaultStateManager();
```

That is fine for client-only apps and demos.
It is not the right default for SvelteKit because it reuses process-wide state.

## Persistence adapters and SSR

Persistence adapters that access browser storage (`localStorage`, `sessionStorage`, IndexedDB)
are **browser-only**. Referencing them on the server throws a `ReferenceError` because those
globals do not exist in a Node.js environment.

Use the memory adapter as a server-safe fallback:

```ts
import { browser } from '$app/environment';
import { createLocalStorageAdapter, createMemoryStorageAdapter } from '@selfagency/stately/persistence';

const useMyStore = defineStore('my-store', {
	state: () => ({ count: 0 }),
	options: {
		persist: {
			adapter: browser ? createLocalStorageAdapter() : createMemoryStorageAdapter(),
			key: 'my-store'
		}
	}
});
```

## Practical SvelteKit guidance

- Create the manager at the top of the request-owned tree.
- Call `initializeStateManagerContext` inside a component `<script>` block, not in a `.ts` module or `load` function.
- Provide it through context before any stores are instantiated.
- Avoid shared module-level singletons on the server.
- Keep persistence, sync, and browser APIs behind `browser` guards from `$app/environment`.

## Why this matters

Shared singleton state on the server can leak data between requests.
Request-scoped managers keep store instances isolated and make SSR behavior predictable.
