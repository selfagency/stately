import type {
	InspectableStore,
	StatelyInspectorHistoryCapableStore,
	StatelyInspectorStoreAdapter,
	TimelineReader
} from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function hasHistory<State extends object>(
	store: InspectableStore<State>
): store is InspectableStore<State> & StatelyInspectorHistoryCapableStore<State> {
	return '$history' in store && '$timeTravel' in store && isRecord(store.$history) && isRecord(store.$timeTravel);
}

export function createStatelyInspectorStoreAdapter<State extends object>(config: {
	store: InspectableStore<State>;
	timeline: TimelineReader;
}): StatelyInspectorStoreAdapter<State> {
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- listeners are never consumed reactively
	const listeners = new Set<() => void>();

	const emit = (): void => {
		for (const listener of listeners) {
			listener();
		}
	};

	const unsubscribeMutations = config.store.$subscribe(
		() => {
			emit();
		},
		{ detached: true }
	);

	const unsubscribeActions = config.store.$onAction(({ after, onError }) => {
		after(() => {
			emit();
		});
		onError(() => {
			emit();
		});
	});

	return {
		id: config.store.$id,
		label: config.store.$id,
		read() {
			const snapshot = {
				id: config.store.$id,
				state: $state.snapshot(config.store.$state) as State,
				timeline: config.timeline.read()
			};

			if (!hasHistory(config.store)) {
				return snapshot;
			}

			return {
				...snapshot,
				history: {
					entries: $state.snapshot(config.store.$timeTravel.entries),
					currentIndex: config.store.$timeTravel.currentIndex,
					isReplaying: config.store.$timeTravel.isReplaying
				}
			};
		},
		subscribe(callback) {
			listeners.add(callback);
			return () => {
				listeners.delete(callback);
			};
		},
		goToHistory(index) {
			if (!hasHistory(config.store)) {
				return false;
			}

			const didNavigate = config.store.$timeTravel.goTo(index);
			if (didNavigate) {
				emit();
			}
			return didNavigate;
		},
		dispose() {
			unsubscribeMutations();
			unsubscribeActions();
			listeners.clear();
		}
	};
}
