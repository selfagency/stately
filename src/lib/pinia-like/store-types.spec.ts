import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import type { StoreActionHookContext, StoreDefinition, StoreInstance } from './store-types.js';

describe('store-types', () => {
	it('preserves strong typing for option stores', () => {
		const manager = createStateManager();
		const useCounterStore = defineStore('counter-types', {
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

		expect(counter.count).toBe(0);

		expectTypeOf(useCounterStore).toMatchTypeOf<
			StoreDefinition<
				'counter-types',
				{ count: number },
				{ doubleCount: number },
				{ increment: () => void }
			>
		>();
		expectTypeOf(counter).toMatchTypeOf<
			StoreInstance<
				'counter-types',
				{ count: number },
				{ doubleCount: number },
				{ increment: () => void }
			>
		>();
	});

	it('exposes typed action hook context helpers', () => {
		type ExampleContext = StoreActionHookContext<
			StoreInstance<
				'sample',
				{ count: number },
				Record<never, never>,
				{ increment: (amount: number) => number }
			>,
			'increment',
			[number],
			number
		>;

		expectTypeOf<ExampleContext['name']>().toEqualTypeOf<'increment'>();
		expectTypeOf<ExampleContext['args']>().toEqualTypeOf<[number]>();
		expectTypeOf<Parameters<ExampleContext['after']>[0]>().toEqualTypeOf<
			(result: number) => void
		>();
		expect(true).toBe(true);
	});
});
