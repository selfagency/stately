import type { StoreActionHookContext, StoreState } from '../pinia-like/store-types.js';
import type { DevtoolsTimelineEntry } from '../runtime/devtools-timeline.svelte.js';
import { SvelteSet } from 'svelte/reactivity';
import type { StatelyInspectorHistoryCapableStore, StatelyInspectorStoreAdapter } from './types.js';

interface InspectableStore<State extends StoreState = StoreState> {
	readonly $id: string;
	readonly $state: State;
	$subscribe(callback: () => void, options?: { detached?: boolean }): () => void;
	$onAction(callback: (context: StoreActionHookContext<object, string, unknown[], unknown>) => void): () => void;
}

interface TimelineReader {
	read(): DevtoolsTimelineEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function hasHistory<State extends StoreState>(
	store: InspectableStore<State>
): store is InspectableStore<State> & StatelyInspectorHistoryCapableStore<State> {
	return '$history' in store && '$timeTravel' in store && isRecord(store.$history) && isRecord(store.$timeTravel);
}

export function createStatelyInspectorStoreAdapter<State extends StoreState>(config: {
	store: InspectableStore<State>;
	timeline: TimelineReader;
}): StatelyInspectorStoreAdapter<State> {
	const listeners = new SvelteSet<() => void>();

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
		dispose() {
			unsubscribeMutations();
			unsubscribeActions();
			listeners.clear();
		}
	};
}
