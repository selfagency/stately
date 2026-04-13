import type { HistoryController, HistoryEntry } from './history-controller.svelte.js';

export interface TimeTravelController<State extends object = object> {
	readonly entries: HistoryEntry<State>[];
	readonly currentIndex: number;
	readonly isReplaying: boolean;
	goTo(index: number): boolean;
}

export function createTimeTravelController<State extends object>(config: {
	history: HistoryController<State>;
}): TimeTravelController<State> {
	return {
		get entries() {
			return config.history.entries;
		},
		get currentIndex() {
			return config.history.currentIndex;
		},
		get isReplaying() {
			return config.history.isReplaying;
		},
		goTo(index) {
			return config.history.goTo(index);
		}
	};
}
