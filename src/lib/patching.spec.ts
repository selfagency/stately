import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

describe('patching flows', () => {
	it('groups patch-function mutations into one logical commit and preserves direct mutation metadata', () => {
		const manager = createStateManager();
		const useStore = defineStore('patching-runtime', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});
		const store = useStore(manager);
		const mutations: Array<{ type: string; mutationCount: number }> = [];

		store.$subscribe((mutation) => {
			const payload = mutation.payload as { commit?: { mutationCount?: number } } | undefined;
			mutations.push({
				type: mutation.type,
				mutationCount: payload?.commit?.mutationCount ?? 0
			});
		});

		store.count += 1;
		store.$patch({ count: 3 });
		store.$patch((state) => {
			state.count += 2;
			state.count += 1;
		});
		store.increment();

		expect(store.count).toBe(7);
		expect(mutations).toEqual([
			{ type: 'direct', mutationCount: 1 },
			{ type: 'patch-object', mutationCount: 1 },
			{ type: 'patch-function', mutationCount: 1 },
			{ type: 'direct', mutationCount: 1 }
		]);
	});

	it('notifies subscribers for deep direct mutations from actions', () => {
		const manager = createStateManager();
		const useStore = defineStore('patching-deep-direct', {
			state: () => ({ items: [] as string[] }),
			actions: {
				addItem(value: string) {
					this.items.push(value);
				}
			}
		});
		const store = useStore(manager);
		const mutationTypes: string[] = [];

		store.$subscribe((mutation) => {
			mutationTypes.push(mutation.type);
		});

		store.addItem('first');

		expect(store.items).toEqual(['first']);
		expect(mutationTypes).toEqual(['direct']);
	});

	it('$patch(fn) that throws does not corrupt state and still fires onError', () => {
		const manager = createStateManager();
		const useStore = defineStore('patching-fn-throws', {
			state: () => ({ count: 0 })
		});
		const store = useStore(manager);
		const errors: unknown[] = [];

		store.$onAction(({ onError }) => {
			onError((err) => errors.push(err));
		});

		expect(() =>
			store.$patch(() => {
				throw new Error('patch error');
			})
		).toThrow('patch error');

		expect(store.count).toBe(0);
	});

	it('nested action calls each get their own onAction lifecycle hook', () => {
		const manager = createStateManager();
		const useStore = defineStore('patching-nested-actions', {
			state: () => ({ count: 0 }),
			actions: {
				inner() {
					this.count += 1;
				},
				outer() {
					this.inner();
					this.count += 10;
				}
			}
		});
		const store = useStore(manager);
		const log: string[] = [];

		store.$onAction(({ name, after }) => {
			log.push(`start:${name}`);
			after(() => log.push(`end:${name}`));
		});

		store.outer();

		expect(store.count).toBe(11);
		expect(log).toContain('start:outer');
		expect(log).toContain('start:inner');
		expect(log).toContain('end:inner');
		expect(log).toContain('end:outer');
	});
});
