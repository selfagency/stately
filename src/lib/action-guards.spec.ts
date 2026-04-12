import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

describe('before-action guards', () => {
	it('$onAction before() returning false cancels the action', () => {
		const manager = createStateManager();
		const useStore = defineStore('guard-cancel', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});
		const store = useStore(manager);

		store.$onAction(({ name, before }) => {
			before(() => {
				if (name === 'increment') return false;
			});
		});

		store.increment();
		expect(store.count).toBe(0);
	});

	it('before() returning true or undefined allows the action', () => {
		const manager = createStateManager();
		const useStore = defineStore('guard-allow', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});
		const store = useStore(manager);

		store.$onAction(({ before }) => {
			before(() => true);
		});

		store.increment();
		expect(store.count).toBe(1);
	});

	it('cancelled actions do not trigger after() or onError()', () => {
		const manager = createStateManager();
		const useStore = defineStore('guard-no-after', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});
		const store = useStore(manager);

		const afterCalls: unknown[] = [];
		const errorCalls: unknown[] = [];

		store.$onAction(({ before, after, onError }) => {
			before(() => false);
			after(() => afterCalls.push('called'));
			onError(() => errorCalls.push('called'));
		});

		store.increment();
		expect(afterCalls).toHaveLength(0);
		expect(errorCalls).toHaveLength(0);
	});

	it('multiple guards: first returning false cancels', () => {
		const manager = createStateManager();
		const useStore = defineStore('guard-multi', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});
		const store = useStore(manager);

		store.$onAction(({ before }) => {
			before(() => undefined);
		});
		store.$onAction(({ before }) => {
			before(() => false);
		});

		store.increment();
		expect(store.count).toBe(0);
	});

	it('before() receives action args for conditional guarding', () => {
		const manager = createStateManager();
		const useStore = defineStore('guard-args', {
			state: () => ({ count: 0 }),
			actions: {
				add(amount: number) {
					this.count += amount;
				}
			}
		});
		const store = useStore(manager);

		store.$onAction(({ args, before }) => {
			before(() => {
				if ((args[0] as number) > 10) return false;
			});
		});

		store.add(5);
		expect(store.count).toBe(5);

		store.add(15);
		expect(store.count).toBe(5);
	});

	it('cancelled actions return undefined', () => {
		const manager = createStateManager();
		const useStore = defineStore('guard-return', {
			state: () => ({ count: 0 }),
			actions: {
				increment(): number {
					this.count += 1;
					return this.count;
				}
			}
		});
		const store = useStore(manager);

		store.$onAction(({ before }) => {
			before(() => false);
		});

		const result = store.increment();
		expect(result).toBeUndefined();
		expect(store.count).toBe(0);
	});
});
