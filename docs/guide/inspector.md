# Inspector

The inspector is a dev-only Vite integration that mounts a drawer in the browser,
shows active Stately stores, renders live snapshots, displays timeline entries,
and exposes history replay controls when a store uses the history plugin.

## Install in Vite

Use the Vite subpath export in development:

```ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { createStatelyInspectorVitePlugin } from '@selfagency/stately/inspector/vite';

export default defineConfig({
	plugins: [sveltekit(), createStatelyInspectorVitePlugin()]
});
```

The plugin is serve-only by default. It transforms Vite's dev client so the
inspector loads before your app entry modules create stores.

## What it shows

- every registered store on the page, grouped by `$id`
- a live JSON snapshot of the selected store
- mutation and action timeline entries from the internal devtools recorder
- history entries and replay controls when the store exposes `$history` and `$timeTravel`

## SSR and browser behavior

The inspector is browser-only.
It does not register any global server-side singleton by default and does not
inject production HTML unless you opt into a custom path later.

For SvelteKit development this matters because `transformIndexHtml` is not a
reliable primary injection point. The inspector uses the Vite dev client
transform path instead.

## Manual fallback

If your environment cannot use the dev-client transform path, you can mount the
runtime manually:

```ts
import {
	InspectorDrawer,
	createStatelyInspectorHook,
	installStatelyInspectorHook
} from '@selfagency/stately/inspector';
```

Install the hook as early as possible, before stores are instantiated, then
render `InspectorDrawer` from your own app shell. Stores created before the hook
exists will not be discovered retroactively.

## Current limits

- development and preview workflow first; not a production debugger
- current formatting is JSON-focused and intentionally conservative
- startup store capture depends on the inspector loading before app entry code
