# SvelteKit data loading

Server-side hydration is a matter of some consequence.
Use this pattern when server `load` functions fetch data and a Stately store
should start from that data without relying on a shared singleton.

## The safe mental model

In SvelteKit:

- `load` functions fetch and return serializable data
- components create request-scoped managers and stores
- component initialization hydrates the store from the returned data

Do **not** mutate shared module state from `load`.

## Step 1: return plain data from the server

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

## Step 2: create the manager in the layout component

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

This keeps the manager request-scoped and lets the store start from the server-provided data before children render.

## Step 3: read the store from context downstream

```ts
import { getStateManager } from '@selfagency/stately';
import { usePreferencesStore } from '$lib/stores/preferences.svelte';

const preferences = usePreferencesStore(getStateManager());
```

## Avoid double-fetching

If the store also has an async action that can fetch the same data, do not call it unconditionally during hydration.

Use one of these strategies:

- trust the server `load` result as the initial source of truth
- check whether the store already has the needed data before calling the action
- let the action refresh later in response to user intent or explicit invalidation

## Browser-only plugins still need guards

If the store also uses persistence, IndexedDB, or other browser APIs, keep
those adapters behind browser guards even when the initial data comes from
`load`.

See [SSR and SvelteKit](/guide/ssr-and-sveltekit) for the browser-boundary rules.

## Related pages

- [SSR and SvelteKit](/guide/ssr-and-sveltekit)
- [Define stores](/guide/define-store)
- [Examples and recipes](/guide/examples)
