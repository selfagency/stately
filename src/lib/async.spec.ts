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

	it('dedupe policy reuses an in-flight call for identical arguments', async () => {
		const gate = deferred<void>();
		const manager = createStateManager().use(
			createAsyncPlugin({
				policies: { dedupedFetch: 'dedupe' }
			})
		);
		const useStore = defineStore('async-dedupe', {
			state: () => ({ calls: 0 }),
			actions: {
				async dedupedFetch() {
					await gate.promise;
					this.calls += 1;
				}
			}
		});
		const store = useStore(manager);

		const first = store.dedupedFetch();
		const second = store.dedupedFetch();

		// Both in-flight calls must share the exact same promise
		expect(second).toBe(first);

		gate.resolve();
		await first;
		await second;

		// Only one execution should have occurred
		expect(store.calls).toBe(1);
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

	it('parallel policy allows all calls to run concurrently', async () => {
		const gates = [deferred<void>(), deferred<void>()];
		let inflightCount = 0;
		let maxInflight = 0;
		const manager = createStateManager().use(createAsyncPlugin({ policies: { work: 'parallel' } }));
		const useStore = defineStore('async-parallel', {
			state: () => ({ log: [] as number[] }),
			actions: {
				async work(n: number, gate: Promise<void>) {
					inflightCount += 1;
					maxInflight = Math.max(maxInflight, inflightCount);
					await gate;
					inflightCount -= 1;
					this.log.push(n);
				}
			}
		});
		const store = useStore(manager);
		const work = store.work as (n: number, gate: Promise<void>) => Promise<void>;

		const first = work(1, gates[0]!.promise);
		const second = work(2, gates[1]!.promise);

		gates[0]!.resolve();
		gates[1]!.resolve();
		await first;
		await second;

		expect(maxInflight).toBe(2);
		expect(store.log).toEqual([1, 2]);
	});

	it('exposes error state on $async after a failed action', async () => {
		const manager = createStateManager().use(createAsyncPlugin());
		const useStore = defineStore('async-error-state', {
			state: () => ({ count: 0 }),
			actions: {
				async failingAction() {
					throw new Error('oops');
				}
			}
		});
		const store = useStore(manager);
		const failingAction = store.failingAction as () => Promise<void>;

		await expect(failingAction()).rejects.toThrow('oops');
		expect(store.$async.failingAction.isLoading).toBe(false);
		expect(store.$async.failingAction.error).toBeInstanceOf(Error);
	});

	it('abort() cancels an in-flight action via its signal', async () => {
		const gate = deferred<void>();
		const manager = createStateManager().use(
			createAsyncPlugin({
				injectSignal(signal, args) {
					return [{ signal }, ...args];
				}
			})
		);
		const useStore = defineStore('async-abort', {
			state: () => ({ count: 0 }),
			actions: {
				async loadData(context: { signal: AbortSignal }) {
					return await new Promise<void>((resolve, reject) => {
						context.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
						gate.promise.then(resolve);
					});
				}
			}
		});
		const store = useStore(manager);
		const loadData = store.loadData as () => Promise<void>;

		const inflight = loadData();
		expect(store.$async.loadData.isLoading).toBe(true);

		store.$async.loadData.abort();
		await expect(inflight).rejects.toThrow(/aborted/i);
		expect(store.$async.loadData.isLoading).toBe(false);
	});

	it('include option restricts which actions are tracked', () => {
		const manager = createStateManager().use(createAsyncPlugin({ include: ['trackedAction'] }));
		const useStore = defineStore('async-include', {
			state: () => ({}),
			actions: {
				async trackedAction() {},
				async untrackedAction() {}
			}
		});
		const store = useStore(manager);

		expect(store.$async.trackedAction).toBeDefined();
		expect(store.$async.untrackedAction).toBeUndefined();
	});

	it('works with no options (default config)', async () => {
		const manager = createStateManager().use(createAsyncPlugin());
		const useStore = defineStore('async-default-opts', {
			state: () => ({ loaded: false }),
			actions: {
				async load() {
					this.loaded = true;
				}
			}
		});
		const store = useStore(manager);
		const load = store.load as () => Promise<void>;

		expect(store.$async.load.isLoading).toBe(false);
		await load();
		expect(store.loaded).toBe(true);
		expect(store.$async.load.isLoading).toBe(false);
		expect(store.$async.load.lastSuccessAt).toBeDefined();
	});
});
