import { describe, expect, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createHistoryPlugin } from './plugin.svelte.js';

describe('createHistoryPlugin', () => {
	it('records store snapshots and exposes undo/redo controls with explicit batching', () => {
		const manager = createStateManager().use(createHistoryPlugin());
		const useCounterStore = defineStore('history-counter', {
			state: () => ({ count: 0 }),
			history: { limit: 5 }
		} as {
			state: () => { count: number };
			history: { limit: number };
		});
		const counter = useCounterStore(manager);

		counter.count = 1;
		counter.count = 2;
		counter.$history.startBatch();
		counter.count = 3;
		counter.count = 4;
		counter.$history.endBatch();

		expect(counter.$history.entries.map((entry) => entry.snapshot.count)).toEqual([0, 1, 2, 4]);
		counter.$history.undo();
		expect(counter.count).toBe(2);
		counter.$history.redo();
		expect(counter.count).toBe(4);
	});
});
