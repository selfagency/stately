# SSR and SvelteKit Patterns

## Table of Contents

- [Core SSR Rule](#core-ssr-rule)
- [Request-Scoped Manager Pattern](#request-scoped-manager-pattern)
- [Reading the Manager Downstream](#reading-the-manager-downstream)
- [SvelteKit Data Loading](#sveltekit-data-loading)
- [Browser-Only Adapters](#browser-only-adapters)
- [getDefaultStateManager Warning](#getdefaultstatemanager-warning)
- [Practical Checklist](#practical-checklist)
- [Common Mistakes](#common-mistakes)

## Core SSR Rule

Create a **fresh manager per request** and provide it through Svelte context.
Never share mutable singleton state on the server — that leaks data between
requests.

## Request-Scoped Manager Pattern

Create the manager in a layout or component `<script>` block.
`initializeStateManagerContext` calls `setContext` internally, so it
**must** be called during component initialization.

```svelte
<!-- +layout.svelte -->
<script>
	import {
		createHistoryPlugin,
		createPersistencePlugin,
		createStateManager,
		initializeStateManagerContext
	} from '@selfagency/stately';

	const manager = createStateManager().use(createPersistencePlugin()).use(createHistoryPlugin());

	initializeStateManagerContext(manager);
</script>

<slot />
```

**Do not** call `initializeStateManagerContext` in:

- A plain `.ts` module
- A `load` function
- Outside component initialization

## Reading the Manager Downstream

```ts
import { getStateManager } from '@selfagency/stately';
import { useCounterStore } from '$lib/stores/counter.js';

const counter = useCounterStore(getStateManager());
```

## SvelteKit Data Loading

### Step 1: Return plain data from server

```ts
// +layout.server.ts
export async function load() {
	return {
		initialPreferences: {
			theme: 'dark',
			compact: false
		}
	};
}
```

### Step 2: Create manager and hydrate in layout

```svelte
<!-- +layout.svelte -->
<script lang="ts">
	import { createStateManager, initializeStateManagerContext } from '@selfagency/stately';
	import { usePreferencesStore } from '$lib/stores/preferences.svelte';

	let { data } = $props();

	const manager = createStateManager();
	initializeStateManagerContext(manager);

	const preferences = usePreferencesStore(manager);
	preferences.$patch(data.initialPreferences);
</script>

<slot />
```

### Step 3: Read store from context downstream

```ts
import { getStateManager } from '@selfagency/stately';
import { usePreferencesStore } from '$lib/stores/preferences.svelte';

const preferences = usePreferencesStore(getStateManager());
```

### Avoid Double-Fetching

If the store has an async action that fetches the same data:

- Trust the server `load` result as initial source of truth
- Check whether store already has data before calling action
- Let actions refresh in response to user intent, not on mount

## Browser-Only Adapters

Browser storage APIs (`localStorage`, `sessionStorage`, IndexedDB) throw
`ReferenceError` on the server. Guard adapter selection:

```ts
import { browser } from '$app/environment';
import { createLocalStorageAdapter, createMemoryStorageAdapter } from '@selfagency/stately';

const useMyStore = defineStore('my-store', {
	state: () => ({ count: 0 }),
	persist: {
		adapter: browser ? createLocalStorageAdapter() : createMemoryStorageAdapter(),
		version: 1,
		key: 'my-store'
	}
});
```

Note: `createLocalStorageAdapter()` is SSR-safe (checks
`globalThis.localStorage` and no-ops when unavailable), but explicit
browser guards make intent clear and avoid subtle issues.

## getDefaultStateManager Warning

`getDefaultStateManager()` is **SPA-only**. It throws during SSR.

On the server, a shared default manager means shared process state.
Shared process state means one request can observe or overwrite another
request's store data. **That is a data leak.**

Only use for:

- Client-only apps
- Demos
- Non-SSR development

## Practical Checklist

1. Create manager at top of request-owned tree
2. Call `initializeStateManagerContext` in a `<script>` block
3. Provide through context before stores are instantiated
4. Use `getStateManager()` to retrieve downstream
5. Guard persistence adapters behind `browser` import
6. Use `storeToRefs()` for destructuring (read/write via `.value`)
7. Keep `load` functions as pure data loaders — no store mutations
8. Avoid shared module-level singletons on the server

## Common Mistakes

### Store leaks across requests

**Cause:** Module-level singleton manager or `getDefaultStateManager()` on server.

**Fix:** Fresh manager per request via context.

### Persistence overwrites restored state

**Cause:** Auto-writes during exploratory changes.

**Fix:** Use `$persist.pause()` / `$persist.resume()`, or add `debounce`.

### Destructuring loses reactivity

**Cause:** Plain JS destructuring snapshots values.

**Fix:** Use `storeToRefs(store)` and access via `.value`.

### Subscription fires too often

**Cause:** Default subscription fires on every mutation.

**Fix:** Use `$subscribe(cb, { select, equalityFn })` to target a slice.

### Async action doesn't cancel

**Cause:** `injectSignal` not configured.

**Fix:** Add `injectSignal: (signal, args) => [signal, ...args]` to
async plugin options, and accept `AbortSignal` in action signature.
