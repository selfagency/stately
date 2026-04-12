import type {
	StatelyInspectorHook,
	StatelyInspectorNotice,
	StatelyInspectorStoreAdapter,
	StatelyInspectorStoreSnapshot
} from './types.js';

function noop(): void {}

export function createInspectorDrawerState(config: { hook: StatelyInspectorHook }) {
	const state = $state<{
		notices: StatelyInspectorNotice[];
		stores: StatelyInspectorStoreAdapter[];
		selectedStoreId: string | null;
		snapshot: StatelyInspectorStoreSnapshot | null;
	}>({
		notices: config.hook.listNotices(),
		stores: config.hook.listStores(),
		selectedStoreId: config.hook.listStores()[0]?.id ?? null,
		snapshot: config.hook.listStores()[0]?.read() ?? null
	});

	let unsubscribeSelectedStore = noop;

	const syncSelection = (): void => {
		unsubscribeSelectedStore();
		const selectedStore = state.stores.find((store) => store.id === state.selectedStoreId);
		state.snapshot = selectedStore?.read() ?? null;
		if (!selectedStore) {
			unsubscribeSelectedStore = noop;
			return;
		}

		unsubscribeSelectedStore = selectedStore.subscribe(() => {
			state.snapshot = selectedStore.read();
		});
	};

	const unsubscribeHook = config.hook.subscribe(() => {
		const previousSelectedStoreId = state.selectedStoreId;
		const nextNotices = config.hook.listNotices();
		const nextStores = config.hook.listStores();

		state.notices = nextNotices;
		state.stores = nextStores;
		if (!state.stores.some((store) => store.id === state.selectedStoreId)) {
			state.selectedStoreId = state.stores[0]?.id ?? null;
		}

		const previousStoreStillExists =
			previousSelectedStoreId !== null && state.stores.some((store) => store.id === previousSelectedStoreId);
		if (state.selectedStoreId !== previousSelectedStoreId || !previousStoreStillExists) {
			syncSelection();
		}
	});

	syncSelection();

	return {
		get notices() {
			return state.notices;
		},
		get stores() {
			return state.stores;
		},
		get selectedStore() {
			return state.stores.find((store) => store.id === state.selectedStoreId) ?? null;
		},
		get selectedStoreId() {
			return state.selectedStoreId;
		},
		get snapshot() {
			return state.snapshot;
		},
		selectStore(id: string) {
			state.selectedStoreId = id;
			syncSelection();
		},
		goToHistory(index: number) {
			const selectedStore = state.stores.find((store) => store.id === state.selectedStoreId);
			if (!selectedStore) {
				return false;
			}

			const didNavigate = selectedStore.goToHistory(index);
			state.snapshot = selectedStore.read();
			return didNavigate;
		},
		clearNotices() {
			config.hook.clearNotices();
		},
		destroy() {
			unsubscribeSelectedStore();
			unsubscribeHook();
		}
	};
}
