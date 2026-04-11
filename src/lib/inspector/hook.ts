import { createStatelyInspectorStoreAdapter } from './store-adapter.svelte.js';
import type { InspectableStore, StatelyInspectorHook, StatelyInspectorStoreAdapter, TimelineReader } from './types.js';
import { statelyInspectorAdapterKey } from './types.js';

const statelyInspectorHookKey = Symbol.for('stately.inspector.hook');

function notify(listeners: Set<() => void>): void {
	for (const listener of listeners) {
		listener();
	}
}

export function createStatelyInspectorHook(): StatelyInspectorHook {
	const stores = new Map<string, StatelyInspectorStoreAdapter>();
	const listeners = new Set<() => void>();

	const hook: StatelyInspectorHook = {
		registerStore(adapter) {
			stores.set(adapter.id, adapter);
			notify(listeners);

			return () => {
				if (stores.get(adapter.id) !== adapter) {
					return;
				}
				stores.delete(adapter.id);
				notify(listeners);
			};
		},
		register(store: InspectableStore, timeline: TimelineReader) {
			const adapter = createStatelyInspectorStoreAdapter({ store, timeline });
			Object.defineProperty(store, statelyInspectorAdapterKey, {
				value: adapter,
				enumerable: false,
				configurable: true,
				writable: false
			});
			const unregister = hook.registerStore(adapter);
			return () => {
				unregister();
				adapter.dispose();
				Reflect.deleteProperty(store as object, statelyInspectorAdapterKey);
			};
		},
		listStores() {
			return [...stores.values()];
		},
		subscribe(callback) {
			listeners.add(callback);
			return () => {
				listeners.delete(callback);
			};
		}
	};

	return hook;
}

export function getStatelyInspectorHook(): StatelyInspectorHook | undefined {
	return Reflect.get(globalThis, statelyInspectorHookKey) as StatelyInspectorHook | undefined;
}

export function installStatelyInspectorHook(hook: StatelyInspectorHook): StatelyInspectorHook {
	Reflect.set(globalThis, statelyInspectorHookKey, hook);
	return hook;
}

export function resetStatelyInspectorHookForTests(): void {
	Reflect.deleteProperty(globalThis, statelyInspectorHookKey);
}
