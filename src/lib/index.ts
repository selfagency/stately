export { defineStore } from './define-store.svelte.js';
export { storeToRefs } from './pinia-like/store-to-refs.svelte.js';
export { createStateManager, getDefaultStateManager } from './root/create-state-manager.js';
export {
	getStateManager,
	initializeStateManagerContext,
	setStateManager
} from './root/state-manager-context.js';

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
