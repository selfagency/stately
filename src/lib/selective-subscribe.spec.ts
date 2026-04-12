import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

describe('selective subscriptions', () => {
	it('$subscribe with select only fires when selected value changes', () => {
		const manager = createStateManager();
		const useStore = defineStore('sel-sub-basic', {
			state: () => ({ name: 'Alice', age: 30 }),
			actions: {
				setName(name: string) {
					this.name = name;
				},
				setAge(age: number) {
					this.age = age;
				}
			}
		});
		const store = useStore(manager);

		const nameMutations: string[] = [];
		store.$subscribe(
			(_mutation, state) => {
				nameMutations.push(state.name);
			},
			{ detached: true, select: (state) => state.name }
		);

		store.setAge(31);
		expect(nameMutations).toHaveLength(0);

		store.setName('Bob');
		expect(nameMutations).toEqual(['Bob']);

		store.setAge(32);
		expect(nameMutations).toEqual(['Bob']);

		store.setName('Charlie');
		expect(nameMutations).toEqual(['Bob', 'Charlie']);
	});

	it('$subscribe without select fires on every mutation (existing behavior)', () => {
		const manager = createStateManager();
		const useStore = defineStore('sel-sub-all', {
			state: () => ({ name: 'Alice', age: 30 }),
			actions: {
				setName(name: string) {
					this.name = name;
				},
				setAge(age: number) {
					this.age = age;
				}
			}
		});
		const store = useStore(manager);

		const mutations: string[] = [];
		store.$subscribe(
			(mutation) => {
				mutations.push(mutation.type);
			},
			{ detached: true }
		);

		store.setAge(31);
		store.setName('Bob');
		expect(mutations).toHaveLength(2);
	});

	it('select supports custom equality function', () => {
		const manager = createStateManager();
		const useStore = defineStore('sel-sub-equality', {
			state: () => ({ items: ['a', 'b'] }),
			actions: {
				setItems(items: string[]) {
					this.items = items;
				}
			}
		});
		const store = useStore(manager);

		const calls: string[][] = [];
		store.$subscribe(
			(_mutation, state) => {
				calls.push([...state.items]);
			},
			{
				detached: true,
				select: (state) => state.items,
				equalityFn: (prev, next) => {
					if (!Array.isArray(prev) || !Array.isArray(next)) return false;
					return prev.length === next.length && prev.every((v, i) => v === next.at(i));
				}
			}
		);

		store.setItems(['a', 'b']);
		expect(calls).toHaveLength(0);

		store.setItems(['a', 'b', 'c']);
		expect(calls).toHaveLength(1);
	});

	it('select works with $patch', () => {
		const manager = createStateManager();
		const useStore = defineStore('sel-sub-patch', {
			state: () => ({ x: 1, y: 2 })
		});
		const store = useStore(manager);

		const xValues: number[] = [];
		store.$subscribe(
			(_mutation, state) => {
				xValues.push(state.x);
			},
			{ detached: true, select: (state) => state.x }
		);

		store.$patch({ y: 10 });
		expect(xValues).toHaveLength(0);

		store.$patch({ x: 5 });
		expect(xValues).toEqual([5]);
	});
});
