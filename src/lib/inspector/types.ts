import type { TimeTravelController } from '../history/time-travel.svelte.js';
import type { DevtoolsTimelineEntry } from '../runtime/devtools-timeline.svelte.js';

export const statelyInspectorAdapterKey = Symbol.for('stately.inspector.adapter');

export interface StatelyInspectorHistorySnapshot {
	entries: Array<{ snapshot: unknown; timestamp: number }>;
	currentIndex: number;
	isReplaying: boolean;
}

export interface StatelyInspectorStoreSnapshot<State = unknown> {
	id: string;
	state: State;
	timeline: DevtoolsTimelineEntry[];
	history?: StatelyInspectorHistorySnapshot;
}

export interface StatelyInspectorStoreAdapter<State = unknown> {
	readonly id: string;
	read(): StatelyInspectorStoreSnapshot<State>;
	subscribe(callback: () => void): () => void;
	goToHistory(index: number): boolean;
	dispose(): void;
}

export interface StatelyInspectorHook {
	registerStore(adapter: StatelyInspectorStoreAdapter): () => void;
	listStores(): StatelyInspectorStoreAdapter[];
	subscribe(callback: () => void): () => void;
}

export interface StatelyInspectorHistoryCapableStore<State = Record<string, unknown>> {
	readonly $history: {
		readonly entries: Array<{ snapshot: State; timestamp: number }>;
		readonly currentIndex: number;
		readonly isReplaying: boolean;
	};
	readonly $timeTravel: TimeTravelController<State>;
}
