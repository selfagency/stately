import { describe, expect, it, vi } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';

describe('store shell helpers', () => {
	it('adds core shell helpers and routes mutations/actions through them', async () => {
		const manager = createStateManager();
		const useCounterStore = defineStore('counter-shell', {
			state: () => ({ count: 0 }),
			actions: {
				increment(amount = 1) {
					this.count += amount;
					return this.count;
				}
			}
		});

		const counter = useCounterStore(manager);
		const mutations: Array<{ type: string; count: number }> = [];
		const actions: Array<string> = [];

		counter.$subscribe((mutation, state) => {
			mutations.push({ type: mutation.type, count: state.count });
		});
		counter.$onAction(({ name, after }) => {
			actions.push(`start:${name}`);
			after((result) => {
				actions.push(`after:${String(result)}`);
			});
		});

		expect(counter.$id).toBe('counter-shell');
		expect(counter.$state.count).toBe(0);

		counter.$patch({ count: 2 });
		counter.$patch((state) => {
			state.count += 1;
		});
		counter.increment(2);
		counter.$state = { count: 10 };
		counter.$reset();

		expect(counter.count).toBe(0);
		expect(mutations.map((entry) => entry.type)).toEqual([
			'patch-object',
			'patch-function',
			'direct',
			'patch-object',
			'patch-object'
		]);
		expect(actions).toEqual(['start:increment', 'after:5']);

		counter.$dispose();
		counter.increment();
		expect(mutations).toHaveLength(5);
	});

	it('does not notify subscribers or record mutations after $dispose()', () => {
		const manager = createStateManager();
		const useStore = defineStore('disposed-test', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});

		const store = useStore(manager);
		const mutationSpy = vi.fn();
		store.$subscribe(mutationSpy, { detached: true });

		store.$patch({ count: 1 });
		expect(mutationSpy).toHaveBeenCalledTimes(1);

		store.$dispose();
		store.$patch({ count: 2 });
		store.increment();

		// No additional calls after dispose
		expect(mutationSpy).toHaveBeenCalledTimes(1);
	});
});
