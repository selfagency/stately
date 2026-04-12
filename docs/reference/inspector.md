# Inspector reference

The inspector’s helpers and Vite integration, documented for those who prefer to know exactly
what their tools are doing.

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
- ships typed support for the internal `virtual:stately-inspector-options`
  module used by the loader bridge

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

The published `@selfagency/stately/inspector/vite` entrypoint also carries the
ambient type declaration for `virtual:stately-inspector-options`, so editor
support remains intact when the plugin is consumed from the packaged library.

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

## `formatInspectorValue(value)`

Serializes any value to a human-readable JSON string for display in custom inspector UIs.

```ts
import { formatInspectorValue } from '@selfagency/stately/inspector';

console.log(formatInspectorValue({ count: 1, fn: () => {} }));
// '{\n  "count": 1,\n  "fn": "[Function fn]"\n}'
```

Handles circular references, `bigint`, `Function`, and `Symbol` gracefully. Returns `'null'` when the value cannot be serialized.

## `reportStatelyInspectorNotice(message, level?)`

Emits a notice to the currently installed inspector hook. Useful for signaling warnings or
diagnostic messages from plugins or store actions without coupling them to the inspector directly.

```ts
import { reportStatelyInspectorNotice } from '@selfagency/stately/inspector';

reportStatelyInspectorNotice('State migration ran', 'warning');
```

`level` defaults to `'warning'`. Valid values are `'warning'`, `'alert'`, and `'dialog'`.

Does nothing when no inspector hook is installed.

## `resetStatelyInspectorHook()`

Removes the globally installed inspector hook without disposing the hook object. Primarily
intended for testing to ensure a clean slate between test cases.

```ts
import { resetStatelyInspectorHook } from '@selfagency/stately/inspector';

afterEach(() => {
	resetStatelyInspectorHook();
});
```

## `StatelyInspectorHook` interface

The hook returned by `createStatelyInspectorHook()` implements this interface:

```ts
interface StatelyInspectorHook {
	registerStore(adapter: StatelyInspectorStoreAdapter): () => void;
	register(store: InspectableStore, timeline: TimelineReader): () => void;
	listStores(): StatelyInspectorStoreAdapter[];
	listNotices(): StatelyInspectorNotice[];
	notifyNotice(notice: StatelyInspectorNotice): void;
	clearNotices(): void;
	subscribe(callback: () => void): () => void;
}
```

| Method                      | Description                                                                   |
| --------------------------- | ----------------------------------------------------------------------------- |
| `registerStore(adapter)`    | Registers a raw store adapter and returns an unregister function.             |
| `register(store, timeline)` | Creates and registers an adapter from an `InspectableStore`.                  |
| `listStores()`              | Returns the list of currently registered store adapters.                      |
| `listNotices()`             | Returns all notices that have been submitted via `notifyNotice()`.            |
| `notifyNotice(notice)`      | Adds a notice and notifies subscribers.                                       |
| `clearNotices()`            | Removes all notices and notifies subscribers.                                 |
| `subscribe(callback)`       | Subscribes to store-list and notice changes. Returns an unsubscribe function. |

## `StatelyInspectorNotice`

```ts
interface StatelyInspectorNotice {
	message: string;
	level: StatelyInspectorNoticeLevel;
	timestamp: number;
}
```

## `StatelyInspectorNoticeLevel`

```ts
type StatelyInspectorNoticeLevel = 'warning' | 'alert' | 'dialog';
```

| Level       | Intended use                                                    |
| ----------- | --------------------------------------------------------------- |
| `'warning'` | Non-critical diagnostic messages (default).                     |
| `'alert'`   | Serious issue that requires attention.                          |
| `'dialog'`  | Blocking or interactive message that needs user acknowledgment. |

## Public types

`@selfagency/stately/inspector` exports these public types:

- `StatelyInspectorHook`
- `StatelyInspectorStoreAdapter`
- `StatelyInspectorStoreSnapshot`
- `StatelyInspectorHistorySnapshot`
- `StatelyInspectorButtonPosition`
- `StatelyInspectorPanelSide`
- `StatelyInspectorNotice`
- `StatelyInspectorNoticeLevel`
