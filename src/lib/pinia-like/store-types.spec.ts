import { describe, expect, expectTypeOf, it } from 'vitest';
import { createMemoryStorageAdapter } from '../persistence/adapters/memory-storage.js';
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
			StoreDefinition<'counter-types', { count: number }, { doubleCount: number }, { increment: () => void }>
		>();
		expectTypeOf(counter).toMatchTypeOf<
			StoreInstance<'counter-types', { count: number }, { doubleCount: number }, { increment: () => void }>
		>();
	});

	it('types subscribe selectors and equality functions consistently', () => {
		const manager = createStateManager();
		const useCounterStore = defineStore('selector-types', {
			state: () => ({ count: 0, label: 'ready' })
		});

		const counter = useCounterStore(manager);
		const unsubscribe = counter.$subscribe(
			() => undefined,
			{
				select: (state) => state.count,
				equalityFn(previous, next) {
					expectTypeOf(previous).toEqualTypeOf<number>();
					expectTypeOf(next).toEqualTypeOf<number>();
					return previous === next;
				}
			}
		);

		unsubscribe();
		expect(true).toBe(true);
	});

	it('types validation and persistence options against store state', () => {
		defineStore('typed-options', {
			state: () => ({ count: 0, label: 'ready' }),
			validate(state) {
				expectTypeOf(state.count).toEqualTypeOf<number>();
				expectTypeOf(state.label).toEqualTypeOf<string>();
				return state.count >= 0 || 'Count must stay positive';
			},
			persist: {
				adapter: createMemoryStorageAdapter(),
				version: 1,
				pick: ['count']
			}
		});

		defineStore('typed-options-omit', {
			state: () => ({ count: 0, label: 'ready' }),
			persist: {
				adapter: createMemoryStorageAdapter(),
				version: 1,
				omit: ['label']
			}
		});

		defineStore('invalid-persist-options', {
			state: () => ({ count: 0, label: 'ready' }),
			persist: {
				adapter: createMemoryStorageAdapter(),
				version: 1,
				pick: ['count'],
				// @ts-expect-error pick and omit are mutually exclusive
				omit: ['label']
			}
		});

		expect(true).toBe(true);
	});

	it('exposes typed action hook context helpers', () => {
		type ExampleContext = StoreActionHookContext<
			StoreInstance<'sample', { count: number }, Record<never, never>, { increment: (amount: number) => number }>,
			'increment',
			[number],
			number
		>;

		expectTypeOf<ExampleContext['name']>().toEqualTypeOf<'increment'>();
		expectTypeOf<ExampleContext['args']>().toEqualTypeOf<[number]>();
		expectTypeOf<Parameters<ExampleContext['after']>[0]>().toEqualTypeOf<(result: number) => void>();
		expect(true).toBe(true);
	});
});
