import { describe, expect, it } from 'vitest';
import { trackAsyncAction } from './track-async-action.svelte.js';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

describe('trackAsyncAction', () => {
	it('tracks loading, success, failure, and exposes abort metadata', async () => {
		let tick = 100;
		const tracked = trackAsyncAction<[number], number>(
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

	it('supports abort signals and ignores stale async results', async () => {
		const firstRequest = deferred<number>();
		const tracked = trackAsyncAction<[number], number>(
			(async ({ signal }: { signal: AbortSignal }, value: number) => {
				if (value === 1) {
					return await new Promise<number>((resolve, reject) => {
						signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
						firstRequest.promise.then(resolve);
					});
				}

				return value;
			}) as unknown as (...args: [number]) => Promise<number>,
			{
				policy: 'restartable',
				injectSignal: (signal, args) => [{ signal }, ...args]
			}
		);

		const first = tracked.run(1);
		const second = tracked.run(2);
		firstRequest.resolve(99);

		await expect(first).rejects.toThrow(/aborted/i);
		await expect(second).resolves.toBe(2);
		expect(tracked.state.lastSuccessAt).toBeDefined();
		expect(tracked.state.isLoading).toBe(false);

		const abortable = deferred<number>();
		const directlyAbortable = trackAsyncAction<[], number>(
			(async ({ signal }: { signal: AbortSignal }) =>
				await new Promise<number>((resolve, reject) => {
					signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
					abortable.promise.then(resolve);
				})) as unknown as (...args: []) => Promise<number>,
			{ injectSignal: (signal, args) => [{ signal }, ...args] }
		);

		const pending = directlyAbortable.run();
		directlyAbortable.state.abort();
		abortable.resolve(1);

		await expect(pending).rejects.toThrow(/aborted/i);
		expect(directlyAbortable.state.isLoading).toBe(false);
		expect(String(directlyAbortable.state.error)).toContain('AbortError');
	});

	it('keeps isLoading true while multiple parallel requests are in flight', async () => {
		const first = deferred<number>();
		const second = deferred<number>();
		const tracked = trackAsyncAction(async (which: number) => {
			if (which === 1) return first.promise;
			return second.promise;
		});

		const p1 = tracked.run(1);
		expect(tracked.state.isLoading).toBe(true);

		const p2 = tracked.run(2);
		expect(tracked.state.isLoading).toBe(true);

		// Resolve the second request first
		second.resolve(20);
		await p2;
		// First is still in flight, so isLoading should remain true
		expect(tracked.state.isLoading).toBe(true);

		// Resolve the first request
		first.resolve(10);
		await p1;
		// Now all requests are done
		expect(tracked.state.isLoading).toBe(false);
	});
});
