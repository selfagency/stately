import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

describe('defineStore', () => {
	it('creates option stores with direct state, getter, and action access', () => {
		const manager = createStateManager();
		const useCounterStore = defineStore('counter', {
			state: () => ({ count: 0 }),
			getters: {
				doubleCount(state) {
					return state.count * 2;
				}
			},
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});

		const counter = useCounterStore(manager);

		counter.increment();

		expect(counter.count).toBe(1);
		expect(counter.doubleCount).toBe(2);
		expect(useCounterStore(manager)).toBe(counter);
	});

	it('creates setup stores per manager and keeps instances isolated', () => {
		const firstManager = createStateManager();
		const secondManager = createStateManager();
		const useTodosStore = defineStore('todos', () => ({
			items: [] as string[],
			add(item: string) {
				this.items.push(item);
			}
		}));

		const firstStore = useTodosStore(firstManager);
		const secondStore = useTodosStore(secondManager);

		firstStore.add('write tests');

		expect(firstStore.items).toEqual(['write tests']);
		expect(secondStore.items).toEqual([]);
	});

	it('rejects duplicate store ids across definitions', () => {
		defineStore('duplicate-store', { state: () => ({ count: 0 }) });

		expect(() => defineStore('duplicate-store', { state: () => ({ count: 1 }) })).toThrow(
			/duplicate/i
		);
	});

	it('rejects invalid option store definitions', () => {
		expect(() => defineStore('invalid-store', {} as never)).toThrow(/invalid/i);
	});
});
