import { describe, expect, it } from 'vitest';
import { createAsyncPlugin } from './async/plugin.svelte.js';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

describe('async runtime', () => {
	it('tracks loading state and restartable actions through the public async registry', async () => {
		const first = deferred<number>();
		const manager = createStateManager().use(
			createAsyncPlugin({
				include: ['loadCount'],
				policies: { loadCount: 'restartable' },
				injectSignal(signal, args) {
					return [{ signal }, ...args];
				}
			})
		);
		const useStore = defineStore('async-runtime-store', {
			state: () => ({ count: 0 }),
			actions: {
				async loadCount(context: { signal: AbortSignal }, target: number) {
					if (target === 1) {
						return await new Promise<number>((resolve, reject) => {
							context.signal.addEventListener('abort', () =>
								reject(new DOMException('Aborted', 'AbortError'))
							);
							first.promise.then(resolve);
						});
					}

					this.count = target;
					return target;
				}
			}
		});
		const store = useStore(manager);
		const loadCount = store.loadCount as unknown as (target: number) => Promise<number>;

		const initial = loadCount(1);
		expect(store.$async.loadCount.isLoading).toBe(true);

		const latest = loadCount(2);
		first.resolve(1);

		await expect(initial).rejects.toThrow(/aborted/i);
		await expect(latest).resolves.toBe(2);
		expect(store.count).toBe(2);
		expect(store.$async.loadCount.isLoading).toBe(false);
		expect(store.$async.loadCount.lastSuccessAt).toBeDefined();
	});
});
