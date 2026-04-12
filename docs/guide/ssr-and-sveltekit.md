# SSR and SvelteKit

Stately is safe on the server — provided you configure it correctly.
The safety comes from **how you create managers**.

The short version:

- create a fresh manager per request
- provide it through Svelte context
- keep browser-only adapters behind browser guards
- do **not** use `getDefaultStateManager()` on the server

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

Do **not** use it in SvelteKit SSR code.
On the server, a shared default manager means shared process state.
Shared process state means one request can observe or overwrite another
request's store data. That is not a cute quirk. That is a data leak.

## Persistence adapters and SSR

Persistence adapters that access browser storage (`localStorage`, `sessionStorage`, IndexedDB)
are **browser-only**. Referencing them on the server throws a `ReferenceError` because those
globals do not exist in a Node.js environment.

Use a browser guard or a server-safe fallback adapter:

```ts
import { browser } from '$app/environment';
import { createLocalStorageAdapter, createMemoryStorageAdapter } from '@selfagency/stately/persistence';

const useMyStore = defineStore('my-store', {
	state: () => ({ count: 0 }),
	persist: {
		adapter: browser ? createLocalStorageAdapter() : createMemoryStorageAdapter(),
		version: 1,
		key: 'my-store'
	}
});
```

If your app is truly browser-only, you can keep the browser adapter directly.
If the store definition is shared by server and client, guard the adapter
choice.

## Hydrating stores from `load` data

Do not mutate shared modules from `load` functions.

Instead:

1. fetch data in `+layout.server.ts`, `+page.server.ts`, or another server `load`
2. return plain serialized data
3. create the manager in a layout or component `<script>` block
4. patch the request-scoped store from that returned data during component initialization

Use [SvelteKit data loading](/guide/sveltekit-data-loading) for a concrete pattern.

## Practical SvelteKit guidance

- Create the manager at the top of the request-owned tree.
- Call `initializeStateManagerContext` inside a component `<script>` block, not in a `.ts` module or `load` function.
- Provide it through context before any stores are instantiated.
- Destructuring `storeToRefs(store)` is safe, but the result is a ref wrapper.
  Keep reading and writing through `.value`; if you want plain values,
  read from the store directly instead of unwrapping the refs.
- Avoid shared module-level singletons on the server.
- Keep persistence, sync, and browser APIs behind `browser` guards from `$app/environment`.
- Treat `load` functions as data loaders, not as a place to mutate global state.

## Why this matters

Shared singleton state on the server can leak data between requests.
Request-scoped managers keep store instances isolated and make SSR behavior predictable.
