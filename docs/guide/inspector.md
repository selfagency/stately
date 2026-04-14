# Inspector

The inspector is Stately’s development panel: a drawer in the browser that
shows active stores, renders live snapshots, displays timeline entries,
and exposes history replay controls when a store uses the history plugin.

Use it when you want a live development view of:

- registered stores
- current JSON state
- action and mutation timeline entries
- playback controls for stores that expose history

## Prerequisites

Before you expect the inspector to show useful data:

1. run your app through Vite dev mode
2. install the inspector hook before your stores are created
3. enable the history plugin on stores that should support playback

If a store has no history plugin, the inspector still shows state and timeline,
but playback stays disabled.

## Install in Vite

Use the Vite subpath export in development:

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

The plugin is serve-only by default. It transforms Vite's dev client so the
inspector loads before your app entry modules create stores.

### Recommended setup flow

For a normal SvelteKit or Vite app, this is the intended path:

1. add `statelyVitePlugin()` to `vite.config.ts`
2. start the app with `pnpm run dev`
3. create your stores normally
4. click the floating `Stately` button in the browser

You do **not** need to render `InspectorDrawer` manually when using the Vite
plugin. The plugin already mounts a singleton inspector host.

You can position the floating launcher and panel independently:

- `buttonPosition`: `'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'`
- `panelSide`: `'left' | 'right'`

That lets you keep the inspector out of the way of app-specific controls during development.

### Example placements

```ts
statelyVitePlugin({
  buttonPosition: 'left-top',
  panelSide: 'left'
});
```

```ts
statelyVitePlugin({
  buttonPosition: 'right-bottom',
  panelSide: 'right'
});
```

## What it shows

- every registered store on the page, grouped by `$id`
- a live JSON snapshot of the selected store
- mutation and action timeline entries from the internal devtools recorder
- history entries and replay controls when the store exposes `$history` and `$timeTravel`

## How playback becomes available

Playback is only available when the selected store uses the history plugin.

Example:

```ts
import { createHistoryPlugin, createStateManager, defineStore } from '@selfagency/stately';

const manager = createStateManager().use(createHistoryPlugin());

const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  history: { limit: 20 }
});

const counter = useCounterStore(manager);
```

Without `createHistoryPlugin()` and a store-level `history` option, the
inspector correctly disables playback controls.

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
  createStatelyInspectorHook,
  installStatelyInspectorHook,
  mountStatelyInspector
} from '@selfagency/stately/inspector';

const hook = installStatelyInspectorHook(createStatelyInspectorHook());

mountStatelyInspector({
  buttonPosition: 'right-bottom',
  panelSide: 'right'
});
```

Install the hook as early as possible, before stores are instantiated. Stores
created before the hook exists will not be discovered retroactively.

### Manual mounting rules

- call `installStatelyInspectorHook(...)` before creating stores
- call `mountStatelyInspector(...)` only once per page
- do not mount `InspectorDrawer` separately if you already called `mountStatelyInspector(...)`
- use `disposeStatelyInspector()` for teardown in custom HMR or test flows

If you prefer owning the component yourself, you can still render
`InspectorDrawer` manually, but then **you** are responsible for enforcing the
single-instance rule.

## Verification checklist

After setup, verify the inspector with this quick checklist:

1. the floating `Stately` button appears in the configured corner
2. clicking the button opens exactly one panel
3. clicking the button again closes the same panel
4. the panel lists your stores in the selector
5. mutating a store updates the JSON state view
6. timeline entries appear after actions or direct mutations
7. playback becomes enabled only for history-capable stores

## Troubleshooting

### The button appears, but there are no stores

Usually the hook was installed too late. Make sure the inspector runtime loads
before your app creates stores.

### The inspector opens twice

Do not combine the Vite plugin with a separately rendered `InspectorDrawer`
unless you intentionally disabled the plugin runtime mount.

### Playback never enables

Make sure both of these are true:

- the state manager uses `createHistoryPlugin()`
- the store definition includes a `history` option

## Current limits

- development and preview workflow first; not a production debugger
- current formatting is JSON-focused and intentionally conservative
- startup store capture depends on the inspector loading before app entry code
