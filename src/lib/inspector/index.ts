export { mountStatelyInspector, disposeStatelyInspector } from './bootstrap-client.js';
export { formatInspectorValue } from './format.js';
export { createStatelyInspectorHook, getStatelyInspectorHook, installStatelyInspectorHook } from './hook.js';
export { default as InspectorDrawer } from './InspectorDrawer.svelte';

export type {
	StatelyInspectorHistorySnapshot,
	StatelyInspectorHook,
	StatelyInspectorStoreAdapter,
	StatelyInspectorStoreSnapshot
} from './types.js';
