import { createStatelyInspectorStoreAdapter } from './store-adapter.svelte.js';
import type {
	InspectableStore,
	StatelyInspectorHook,
	StatelyInspectorNotice,
	StatelyInspectorStoreAdapter,
	TimelineReader
} from './types.js';
import { statelyInspectorAdapterKey } from './types.js';

const statelyInspectorHookKey = Symbol.for('stately.inspector.hook');

function notify(listeners: Set<() => void>): void {
	for (const listener of listeners) {
		listener();
	}
}

export function createStatelyInspectorHook(): StatelyInspectorHook {
	const stores = new Map<string, StatelyInspectorStoreAdapter>();
	const notices: StatelyInspectorNotice[] = [];
	const listeners = new Set<() => void>();
	let nextAdapterId = 1;

	const hook: StatelyInspectorHook = {
		registerStore(adapter) {
			const duplicateCount = [...stores.values()].filter((store) => store.label === adapter.label).length;
			const registeredAdapter = {
				...adapter,
				id: `${adapter.id}::${nextAdapterId++}`,
				label: duplicateCount === 0 ? adapter.label : `${adapter.label} (${duplicateCount + 1})`
			} satisfies StatelyInspectorStoreAdapter;

			stores.set(registeredAdapter.id, registeredAdapter);
			notify(listeners);

			return () => {
				if (stores.get(registeredAdapter.id) !== registeredAdapter) {
					return;
				}
				stores.delete(registeredAdapter.id);
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
		listNotices() {
			return [...notices];
		},
		notifyNotice(notice) {
			notices.unshift(notice);
			notify(listeners);
		},
		clearNotices() {
			notices.length = 0;
			notify(listeners);
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
