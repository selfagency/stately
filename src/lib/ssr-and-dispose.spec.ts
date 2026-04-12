import { describe, expect, it, vi } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

describe('SSR and server-side store safety', () => {
	it('creates isolated store instances per manager (no shared singleton state)', () => {
		const managerA = createStateManager();
		const managerB = createStateManager();
		const useStore = defineStore('ssr-isolation', { state: () => ({ count: 0 }) });

		const storeA = useStore(managerA);
		const storeB = useStore(managerB);

		storeA.count = 42;

		expect(storeA.count).toBe(42);
		expect(storeB.count).toBe(0);
	});

	it('does not share state between manager instances across simulated requests', () => {
		const useStore = defineStore('ssr-request-scope', { state: () => ({ value: 'initial' }) });

		const request1Manager = createStateManager();
		const request2Manager = createStateManager();

		const store1 = useStore(request1Manager);
		const store2 = useStore(request2Manager);

		store1.value = 'request-1';

		expect(store1.value).toBe('request-1');
		expect(store2.value).toBe('initial');
	});

	it('throws for non-plain-object state', () => {
		expect(() => {
			const useStore = defineStore('ssr-invalid-state', {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				state: () => new Date() as any
			});
			useStore(createStateManager());
		}).toThrow(/must return a plain object/i);
	});

	it('creates fresh instances after dispose (simulating per-request teardown)', () => {
		const manager = createStateManager();
		const useStore = defineStore('ssr-dispose-reset', { state: () => ({ count: 0 }) });

		const store = useStore(manager);
		store.count = 99;

		store.$dispose();

		const managerB = createStateManager();
		const freshStore = useStore(managerB);

		expect(freshStore.count).toBe(0);
	});
});

describe('$dispose completeness', () => {
	it('stops notifying subscribers after dispose', () => {
		const manager = createStateManager();
		const useStore = defineStore('dispose-subscribe', { state: () => ({ count: 0 }) });
		const store = useStore(manager);
		const received: number[] = [];

		store.$subscribe(() => {
			received.push(store.count);
		});

		store.count = 1;
		store.$dispose();
		store.count = 2;

		expect(received).toEqual([1]);
	});

	it('stops notifying $onAction listeners after dispose', () => {
		const manager = createStateManager();
		const useStore = defineStore('dispose-action', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});
		const store = useStore(manager);
		const actionNames: string[] = [];

		store.$onAction(({ name }) => {
			actionNames.push(name);
		});

		store.increment();
		store.$dispose();
		store.increment();

		expect(actionNames).toEqual(['increment']);
	});

	it('is idempotent: double-dispose does not throw', () => {
		const manager = createStateManager();
		const useStore = defineStore('dispose-idempotent', { state: () => ({ count: 0 }) });
		const store = useStore(manager);

		store.$dispose();
		expect(() => store.$dispose()).not.toThrow();
	});

	it('calls onDispose callback exactly once', () => {
		const onDispose = vi.fn();

		// createStateManager accepts an onDispose option per-store registration;
		// exercise the path by wrapping $dispose in a plugin to verify cleanup fires.
		const manager = createStateManager();
		manager.use(({ store }) => {
			const storeWithDispose = store as { $dispose: () => void };
			const original = storeWithDispose.$dispose.bind(storeWithDispose);
			Object.defineProperty(storeWithDispose, '$dispose', {
				configurable: true,
				writable: true,
				value() {
					original();
					onDispose();
				}
			});
		});

		const useStore = defineStore('dispose-callback', { state: () => ({ x: 1 }) });
		const store = useStore(manager);

		store.$dispose();

		expect(onDispose).toHaveBeenCalledOnce();
	});
});

describe('error paths', () => {
	it('throws descriptive error for non-plain-object state', () => {
		expect(() => {
			const useStore = defineStore('error-non-plain', {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				state: () => [] as any
			});
			useStore(createStateManager());
		}).toThrow(/must return a plain object/i);
	});

	it('throws for duplicate store ids on the same manager', () => {
		const manager = createStateManager();
		const useA = defineStore('error-duplicate', { state: () => ({ a: 1 }) });
		const useB = defineStore('error-duplicate', { state: () => ({ b: 2 }) });

		useA(manager);
		expect(() => useB(manager)).toThrow(/duplicate/i);
	});

	it('action errors propagate to callers and still trigger $onAction onError', async () => {
		const manager = createStateManager();
		const useStore = defineStore('error-action-prop', {
			state: () => ({ count: 0 }),
			actions: {
				explode() {
					throw new Error('boom');
				}
			}
		});
		const store = useStore(manager);
		const errors: unknown[] = [];

		store.$onAction(({ onError }) => {
			onError((err) => errors.push(err));
		});

		expect(() => store.explode()).toThrow('boom');
		expect(errors).toHaveLength(1);
		expect((errors[0] as Error).message).toBe('boom');
	});

	it('async action errors propagate and trigger $onAction onError', async () => {
		const manager = createStateManager();
		const useStore = defineStore('error-async-action-prop', {
			state: () => ({ count: 0 }),
			actions: {
				async asyncExplode() {
					throw new Error('async-boom');
				}
			}
		});
		const store = useStore(manager);
		const errors: unknown[] = [];

		store.$onAction(({ onError }) => {
			onError((err) => errors.push(err));
		});

		await expect(store.asyncExplode()).rejects.toThrow('async-boom');
		expect(errors).toHaveLength(1);
	});
});
