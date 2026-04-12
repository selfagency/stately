# Inspector reference

## `statelyVitePlugin(options?)`

Creates the dev-only Vite plugin that injects the inspector loader into Vite's
dev client.

Use it from `@selfagency/stately/inspector/vite`.

```ts
import { statelyVitePlugin } from '@selfagency/stately/inspector/vite';
```

Typical usage:

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

Behavior notes:

- dev-only (`apply: 'serve'`)
- injects through the Vite dev client path
- mounts a singleton browser inspector host
- should not be combined with a second manually rendered `InspectorDrawer`

### Options

```ts
interface StatelyInspectorVitePluginOptions {
	enabled?: boolean;
	buttonPosition?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
	panelSide?: 'left' | 'right';
}
```

- `enabled` — defaults to `true`; when `false`, the plugin resolves no virtual modules and skips client injection
- `buttonPosition` — defaults to `'right-bottom'`; controls where the floating launcher button appears
- `panelSide` — defaults to `'right'`; controls which side of the viewport the inspector panel slides from

Example:

```ts
statelyVitePlugin({
	buttonPosition: 'left-top',
	panelSide: 'left'
});
```

When `enabled` is `false`, the plugin resolves no virtual inspector modules and
skips client injection entirely.

## `InspectorDrawer`

Browser-side Svelte component that renders the inspector UI.

Use it from `@selfagency/stately/inspector`.

Props:

```ts
interface InspectorDrawerProps {
	hook?: StatelyInspectorHook;
	initiallyOpen?: boolean;
	buttonPosition?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
	panelSide?: 'left' | 'right';
}
```

Use this component directly only when you are managing mounting yourself.

## `createStatelyInspectorHook()`

Creates the in-memory registry used by the drawer and runtime bridge.

Hook behavior:

- `registerStore(adapter)` adds a store adapter and returns an unregister function
- `listStores()` returns the currently registered adapters
- `subscribe(callback)` notifies when the registry changes

Install the hook before any stores are created if you want those stores to be discoverable.

## `installStatelyInspectorHook(hook)`

Installs the hook on `globalThis` so store shells can discover it during store
creation.

## `getStatelyInspectorHook()`

Reads the currently installed global hook, if present.

## `mountStatelyInspector(options?)`

Programmatically mounts the drawer into a fixed browser host element.
Primarily used by the runtime loader.

Accepts the same placement options as `statelyVitePlugin()` plus `initiallyOpen`.

Example:

```ts
import {
	createStatelyInspectorHook,
	installStatelyInspectorHook,
	mountStatelyInspector
} from '@selfagency/stately/inspector';

installStatelyInspectorHook(createStatelyInspectorHook());

mountStatelyInspector({
	initiallyOpen: false,
	buttonPosition: 'left-bottom',
	panelSide: 'left'
});
```

If the inspector is already mounted, subsequent calls do not create another instance.

## `disposeStatelyInspector()`

Unmounts the drawer and removes the host element.
Useful for HMR cleanup and manual teardown.

## Public types

`@selfagency/stately/inspector` exports these public types:

- `StatelyInspectorHook`
- `StatelyInspectorStoreAdapter`
- `StatelyInspectorStoreSnapshot`
- `StatelyInspectorHistorySnapshot`
- `StatelyInspectorButtonPosition`
- `StatelyInspectorPanelSide`
