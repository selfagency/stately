export { useCounterStore } from './option-store/counter.js';
export { usePreferencesStore } from './setup-store/preferences.svelte.js';
export {
	usePreferencesStore as usePersistentPreferencesStore,
	persistenceManager
} from './plugins/persistence.js';
export { useDraftStore, historyManager } from './plugins/history.js';
export { usePresenceStore, createSyncedManager } from './plugins/sync.js';
export { useAsyncCounterStore, asyncManager } from './plugins/async.js';
