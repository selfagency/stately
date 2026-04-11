# Inspector reference

## `statelyVitePlugin(options?)`

Creates the dev-only Vite plugin that injects the inspector loader into Vite's
dev client.

Use it from `@selfagency/stately/inspector/vite`.

```ts
import { statelyVitePlugin } from '@selfagency/stately/inspector/vite';
```

### Options

```ts
interface StatelyInspectorVitePluginOptions {
	enabled?: boolean;
}
```

- `enabled` — defaults to `true`; when `false`, the plugin resolves no virtual modules and skips client injection

## `InspectorDrawer`

Browser-side Svelte component that renders the inspector UI.

Use it from `@selfagency/stately/inspector`.

## `createStatelyInspectorHook()`

Creates the in-memory registry used by the drawer and runtime bridge.

Hook behavior:

- `registerStore(adapter)` adds a store adapter and returns an unregister function
- `listStores()` returns the currently registered adapters
- `subscribe(callback)` notifies when the registry changes

## `installStatelyInspectorHook(hook)`

Installs the hook on `globalThis` so store shells can discover it during store
creation.

## `getStatelyInspectorHook()`

Reads the currently installed global hook, if present.

## `mountStatelyInspector()`

Programmatically mounts the drawer into a fixed browser host element.
Primarily used by the runtime loader.

## `disposeStatelyInspector()`

Unmounts the drawer and removes the host element.
Useful for HMR cleanup and manual teardown.

## Public types

`@selfagency/stately/inspector` exports these public types:

- `StatelyInspectorHook`
- `StatelyInspectorStoreAdapter`
- `StatelyInspectorStoreSnapshot`
- `StatelyInspectorHistorySnapshot`
