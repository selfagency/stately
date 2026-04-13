import { describe, expect, expectTypeOf, it } from 'vitest';
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

	it('preserves interface-based state types through $history and $timeTravel', () => {
		interface HistoryState {
			count: number;
			label: string;
		}

		const manager = createStateManager().use(createHistoryPlugin());
		const useStore = defineStore('typed-history-store', {
			state: (): HistoryState => ({ count: 0, label: 'ready' }),
			history: { limit: 5 }
		});
		const store = useStore(manager);

		store.count = 1;

		expectTypeOf(store.$history.entries[0]!.snapshot.count).toEqualTypeOf<number>();
		expectTypeOf(store.$history.entries[0]!.snapshot.label).toEqualTypeOf<string>();
		expectTypeOf(store.$timeTravel.entries[0]!.snapshot.count).toEqualTypeOf<number>();
		expectTypeOf(store.$timeTravel.entries[0]!.snapshot.label).toEqualTypeOf<string>();
		expect(store.$history.entries.at(-1)?.snapshot).toEqual({ count: 1, label: 'ready' });
	});
});
