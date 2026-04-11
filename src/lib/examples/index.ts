export { useCounterStore } from './option-store/counter.js';
export { asyncManager, useAsyncCounterStore } from './plugins/async.js';
export { historyManager, useDraftStore } from './plugins/history.js';
export {
	persistenceManager,
	usePreferencesStore as usePersistentPreferencesStore
} from './plugins/persistence.js';
export { createSyncedManager, usePresenceStore } from './plugins/sync.js';
export { usePreferencesStore } from './setup-store/preferences.svelte.js';
