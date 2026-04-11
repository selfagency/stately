import { describe, expect, it } from 'vitest';
import { createHistoryController } from './history-controller.svelte.js';

describe('createHistoryController', () => {
	it('tracks undo/redo state, enforces a limit, and batches explicit groups', () => {
		const applied: Array<{ count: number }> = [];
		const controller = createHistoryController({
			initialSnapshot: { count: 0 },
			limit: 3,
			applySnapshot(snapshot) {
				applied.push(snapshot);
			}
		});

		controller.record({ count: 1 });
		controller.record({ count: 2 });
		controller.startBatch();
		controller.record({ count: 3 });
		controller.record({ count: 4 });
		controller.endBatch();

		expect(controller.canUndo).toBe(true);
		expect(controller.entries.map((entry) => entry.snapshot.count)).toEqual([1, 2, 4]);

		controller.undo();
		expect(applied.at(-1)).toEqual({ count: 2 });
		expect(controller.canRedo).toBe(true);
		controller.redo();
		expect(applied.at(-1)).toEqual({ count: 4 });
	});
});
