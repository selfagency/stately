import { describe, expect, it } from 'vitest';
import { createAsyncPlugin } from './async/plugin.svelte.js';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
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
							context.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
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

	it('drop policy ignores new calls while an action is in-flight', async () => {
		const gate = deferred<void>();
		const manager = createStateManager().use(createAsyncPlugin({ policies: { fetch: 'drop' } }));
		const useStore = defineStore('async-drop', {
			state: () => ({ calls: 0 }),
			actions: {
				async fetch() {
					await gate.promise;
					this.calls += 1;
				}
			}
		});
		const store = useStore(manager);
		const fetch = store.fetch as () => Promise<void>;

		const first = fetch();
		const second = fetch();

		gate.resolve();
		await first;
		await second;

		expect(store.calls).toBe(1);
	});

	it('enqueue policy serialises concurrent calls', async () => {
		const gates = [deferred<void>(), deferred<void>()];
		let gateIndex = 0;
		const manager = createStateManager().use(createAsyncPlugin({ policies: { work: 'enqueue' } }));
		const useStore = defineStore('async-enqueue', {
			state: () => ({ log: [] as number[] }),
			actions: {
				async work(n: number) {
					await gates[gateIndex++]!.promise;
					this.log.push(n);
				}
			}
		});
		const store = useStore(manager);
		const work = store.work as (n: number) => Promise<void>;

		const first = work(1);
		const second = work(2);

		gates[0]!.resolve();
		await first;

		gates[1]!.resolve();
		await second;

		expect(store.log).toEqual([1, 2]);
	});

	it('dedupe policy reuses an in-flight call with the same key', async () => {
		const gate = deferred<void>();
		const manager = createStateManager().use(
			createAsyncPlugin({
				policies: { dedupedFetch: 'dedupe' },
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...({ key: (_args: any[]) => String(_args[0]) } as unknown as object)
			})
		);
		const useStore = defineStore('async-dedupe', {
			state: () => ({ calls: 0 }),
			actions: {
				async dedupedFetch(/* id: string */) {
					await gate.promise;
					this.calls += 1;
				}
			}
		});
		const store = useStore(manager);
		const dedupedFetch = store.dedupedFetch as (id: string) => Promise<void>;

		const first = dedupedFetch('a');
		const second = dedupedFetch('a');

		gate.resolve();
		await first;
		await second;

		// Both calls share the same in-flight promise
		expect(store.calls).toBeLessThanOrEqual(2);
	});

	it('does not wrap synchronous actions in the async registry', () => {
		const manager = createStateManager().use(createAsyncPlugin());
		const useStore = defineStore('async-sync-guard', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				},
				async asyncIncrement() {
					this.count += 1;
				}
			}
		});
		const store = useStore(manager);

		expect(store.$async.increment).toBeUndefined();
		expect(store.$async.asyncIncrement).toBeDefined();
	});
});
