export { createExternalSubscriber } from './async/external-subscribe.js';
export { createAsyncPlugin } from './async/plugin.svelte.js';
export { defineStore } from './define-store.svelte.js';
export { createHistoryPlugin } from './history/plugin.svelte.js';
export { createPersistencePlugin } from './persistence/plugin.svelte.js';
export { storeToRefs } from './pinia-like/store-to-refs.svelte.js';
export { createStateManager, getDefaultStateManager } from './root/create-state-manager.js';
export {
	getStateManager,
	initializeStateManagerContext,
	setStateManager
} from './root/state-manager-context.js';
export { createSyncPlugin } from './sync/plugin.svelte.js';

export type { ConcurrencyMode } from './async/concurrency.js';
export type { AsyncActionRegistry } from './async/plugin.svelte.js';
export type { DefineSetupStoreOptions } from './define-store.svelte.js';
export type { HistoryStoreOptions, PersistStoreOptions } from './pinia-like/plugin-options.js';
export type { StoreRef, StoreRefs } from './pinia-like/store-to-refs.svelte.js';
export type {
	DefineStoreOptionsBase,
	StoreActionHookContext,
	StoreActions,
	StoreCustomProperties,
	StoreCustomStateProperties,
	StoreDefinition,
	StoreGetters,
	StoreInstance,
	StoreMutationContext,
	StoreState
} from './pinia-like/store-types.js';
export type { StateManager, StateManagerPlugin } from './root/types.js';
