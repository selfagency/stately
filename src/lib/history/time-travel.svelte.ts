import type { HistoryController, HistoryEntry } from './history-controller.svelte.js';

export interface TimeTravelController<State = Record<string, unknown>> {
	readonly entries: HistoryEntry<State>[];
	readonly currentIndex: number;
	readonly isReplaying: boolean;
	goTo(index: number): boolean;
}

export function createTimeTravelController<State extends Record<string, unknown>>(config: {
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
