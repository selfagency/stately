import type { HistoryEntry } from '../history/history-controller.svelte.js';
import type { TimeTravelController } from '../history/time-travel.svelte.js';
import type { DevtoolsTimelineEntry } from '../runtime/devtools-timeline.svelte.js';

export const statelyInspectorAdapterKey = Symbol.for('stately.inspector.adapter');

export interface StatelyInspectorHistorySnapshot<State = Record<string, unknown>> {
	entries: HistoryEntry<State>[];
	currentIndex: number;
	isReplaying: boolean;
}

export interface StatelyInspectorStoreSnapshot<State = Record<string, unknown>> {
	id: string;
	state: State;
	timeline: DevtoolsTimelineEntry[];
	history?: StatelyInspectorHistorySnapshot<State>;
}

export interface StatelyInspectorStoreAdapter<State = Record<string, unknown>> {
	readonly id: string;
	read(): StatelyInspectorStoreSnapshot<State>;
	subscribe(callback: () => void): () => void;
	dispose(): void;
}

export interface StatelyInspectorHook {
	registerStore(adapter: StatelyInspectorStoreAdapter): () => void;
	listStores(): StatelyInspectorStoreAdapter[];
	subscribe(callback: () => void): () => void;
}

export interface StatelyInspectorHistoryCapableStore<State = Record<string, unknown>> {
	readonly $history: {
		readonly entries: HistoryEntry<State>[];
		readonly currentIndex: number;
		readonly isReplaying: boolean;
	};
	readonly $timeTravel: TimeTravelController<State>;
}
