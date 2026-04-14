import { createHistoryPlugin, createStateManager, defineStore } from '../../lib/index.js';
import type { HistoryController, TimeTravelController } from '../../lib/index.js';

// ---------------------------------------------------------------------------
// Store definition — history options are part of the schema
// ---------------------------------------------------------------------------

const _useHistoryStore = defineStore('history-counter', {
	state: () => ({ count: 0, label: 'initial' }),
	history: { limit: 10 }
} as {
	state: () => { count: number; label: string };
	history: { limit: number };
});

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------

export interface HistoryDemo {
	store: ReturnType<typeof _useHistoryStore> & {
		$history: HistoryController<{ count: number; label: string }>;
		$timeTravel: TimeTravelController<{ count: number; label: string }>;
	};
	increment(): void;
	setLabel(label: string): void;
	batchIncrement(times: number): void;
	destroy(): void;
}

export function createHistoryDemo(): HistoryDemo {
	const manager = createStateManager().use(createHistoryPlugin());
	const store = _useHistoryStore(manager) as HistoryDemo['store'];

	return {
		store,
		increment() {
			store.$patch((s) => {
				s.count += 1;
			});
		},
		setLabel(label: string) {
			store.$patch({ label });
		},
		batchIncrement(times: number) {
			store.$history.startBatch();
			for (let i = 0; i < times; i++) {
				store.$patch((s) => {
					s.count += 1;
				});
			}
			store.$history.endBatch();
		},
		destroy() {
			store.$dispose();
		}
	};
}
