import { describe, expect, it } from 'vitest';
import { trackAsyncAction } from './track-async-action.svelte.js';

describe('trackAsyncAction', () => {
	it('tracks loading, success, failure, and exposes abort metadata', async () => {
		let tick = 100;
		const tracked = trackAsyncAction(
			async (value: number) => {
				if (value < 0) {
					throw new Error('boom');
				}
				return value * 2;
			},
			{ createTimestamp: () => ++tick }
		);

		const pending = tracked.run(2);
		expect(tracked.state.isLoading).toBe(true);
		expect(typeof tracked.state.abort).toBe('function');
		await expect(pending).resolves.toBe(4);
		expect(tracked.state.isLoading).toBe(false);
		expect(tracked.state.lastSuccessAt).toBe(101);
		expect(tracked.state.error).toBeUndefined();

		await expect(tracked.run(-1)).rejects.toThrow('boom');
		expect(tracked.state.isLoading).toBe(false);
		expect(tracked.state.lastFailureAt).toBe(102);
		expect(tracked.state.error).toBeInstanceOf(Error);
	});
});
