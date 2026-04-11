export interface HistoryEntry<State = Record<string, unknown>> {
	snapshot: State;
	timestamp: number;
}

export interface HistoryController<State = Record<string, unknown>> {
	readonly entries: HistoryEntry<State>[];
	readonly currentIndex: number;
	readonly canUndo: boolean;
	readonly canRedo: boolean;
	readonly isReplaying: boolean;
	goTo(index: number): boolean;
	undo(): boolean;
	redo(): boolean;
	record(snapshot: State): void;
	startBatch(): void;
	endBatch(): void;
}

export function createHistoryController<State extends Record<string, unknown>>(config: {
	initialSnapshot: State;
	limit?: number;
	applySnapshot(snapshot: State): void;
}): HistoryController<State> {
	const state = $state({
		entries: [{ snapshot: config.initialSnapshot, timestamp: Date.now() }] as HistoryEntry<State>[],
		index: 0,
		replaying: false,
		batchDepth: 0,
		pendingSnapshot: undefined as State | undefined
	});
	const limit = Math.max(config.limit ?? 50, 1);

	const trim = () => {
		while (state.entries.length > limit) {
			state.entries.shift();
			state.index = Math.max(0, state.index - 1);
		}
	};

	const commit = (snapshot: State) => {
		state.entries.splice(state.index + 1);
		state.entries.push({ snapshot, timestamp: Date.now() });
		state.index = state.entries.length - 1;
		trim();
	};

	return {
		get entries() {
			return state.entries;
		},
		get currentIndex() {
			return state.index;
		},
		get canUndo() {
			return state.index > 0;
		},
		get canRedo() {
			return state.index < state.entries.length - 1;
		},
		get isReplaying() {
			return state.replaying;
		},
		goTo(index) {
			if (index < 0 || index >= state.entries.length || index === state.index) {
				return false;
			}

			state.replaying = true;
			state.index = index;
			config.applySnapshot(state.entries[state.index].snapshot);
			state.replaying = false;
			return true;
		},
		undo() {
			return this.goTo(state.index - 1);
		},
		redo() {
			return this.goTo(state.index + 1);
		},
		record(snapshot) {
			if (state.replaying) {
				return;
			}

			if (state.batchDepth > 0) {
				state.pendingSnapshot = snapshot;
				return;
			}

			commit(snapshot);
		},
		startBatch() {
			state.batchDepth += 1;
		},
		endBatch() {
			if (state.batchDepth === 0) {
				return;
			}

			state.batchDepth -= 1;
			if (state.batchDepth === 0 && state.pendingSnapshot) {
				commit(state.pendingSnapshot);
				state.pendingSnapshot = undefined;
			}
		}
	};
}
