import type { TimeTravelController } from '../history/time-travel.svelte.js';
import type { DevtoolsTimelineEntry } from '../runtime/devtools-timeline.svelte.js';

export const statelyInspectorAdapterKey = Symbol.for('stately.inspector.adapter');

export type StatelyInspectorButtonPosition = 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
export type StatelyInspectorPanelSide = 'left' | 'right';

export type StatelyInspectorNoticeLevel = 'warning' | 'alert' | 'dialog';

export interface StatelyInspectorNotice {
	message: string;
	level: StatelyInspectorNoticeLevel;
	timestamp: number;
}

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
	readonly label: string;
	read(): StatelyInspectorStoreSnapshot<State>;
	subscribe(callback: () => void): () => void;
	goToHistory(index: number): boolean;
	dispose(): void;
}

export interface InspectableStore<State extends object = object> {
	readonly $id: string;
	readonly $state: State;
	$subscribe(callback: (...args: unknown[]) => void, options?: { detached?: boolean }): () => void;
	$onAction(
		callback: (context: {
			after(cb: (result: unknown) => void): void;
			onError(cb: (error: unknown) => void): void;
		}) => void
	): () => void;
}

export interface TimelineReader {
	read(): DevtoolsTimelineEntry[];
}

export interface StatelyInspectorHook {
	registerStore(adapter: StatelyInspectorStoreAdapter): () => void;
	register(store: InspectableStore, timeline: TimelineReader): () => void;
	listStores(): StatelyInspectorStoreAdapter[];
	listNotices(): StatelyInspectorNotice[];
	notifyNotice(notice: StatelyInspectorNotice): void;
	clearNotices(): void;
	subscribe(callback: () => void): () => void;
}

export interface StatelyInspectorHistoryCapableStore<State extends object = object> {
	readonly $history: {
		readonly entries: Array<{ snapshot: State; timestamp: number }>;
		readonly currentIndex: number;
		readonly isReplaying: boolean;
	};
	readonly $timeTravel: TimeTravelController<State>;
}
