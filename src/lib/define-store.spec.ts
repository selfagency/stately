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

	it('rejects duplicate store ids on the same manager', () => {
		const manager = createStateManager();
		const useFirst = defineStore('duplicate-store', { state: () => ({ count: 0 }) });
		const useSecond = defineStore('duplicate-store', { state: () => ({ count: 1 }) });

		useFirst(manager);
		expect(() => useSecond(manager)).toThrow(/duplicate/i);
	});

	it('rejects invalid option store definitions', () => {
		expect(() => defineStore('invalid-store', {} as never)).toThrow(/invalid/i);
	});

	it('accepts persist and history options for option and setup stores', () => {
		const observed: unknown[] = [];
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const manager = createStateManager().use(({ options }) => {
			observed.push(options);
		});

		const optionDefinition = defineStore('plugin-option-counter', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1 },
			history: { limit: 5 }
		});
		const setupDefinition = defineStore('plugin-setup-counter', {
			setup: () => ({ count: 0 }),
			persist: { adapter, version: 1 },
			history: { limit: 5 }
		});

		optionDefinition(manager);
		setupDefinition(manager);

		expect(observed).toEqual([
			expect.objectContaining({
				persist: expect.objectContaining({ version: 1 }),
				history: expect.objectContaining({ limit: 5 })
			}),
			expect.objectContaining({
				persist: expect.objectContaining({ version: 1 }),
				history: expect.objectContaining({ limit: 5 })
			})
		]);
	});

	it('supports setup stores that expose writable accessor properties', () => {
		const manager = createStateManager();
		const usePreferencesStore = defineStore('setup-accessor-contract', {
			setup: () => {
				let theme: 'light' | 'dark' = 'light';

				return {
					get theme() {
						return theme;
					},
					set theme(value: 'light' | 'dark') {
						theme = value;
					}
				};
			}
		});

		const store = usePreferencesStore(manager);

		expect(store.theme).toBe('light');
		store.theme = 'dark';
		expect(store.theme).toBe('dark');
	});

	it('supports class-based setup store members defined on prototypes', () => {
		type CartStoreShape = Record<string, unknown> & {
			items: number;
			readonly summary: string;
			addOne(): void;
		};

		class CartStore {
			items = 0;

			get summary() {
				return `${this.items} items`;
			}

			addOne() {
				this.items += 1;
			}
		}

		const manager = createStateManager();
		const useCartStore = defineStore('setup-class-contract', {
			setup: () => new CartStore() as CartStoreShape
		});

		const store = useCartStore(manager);
		store.addOne();

		expect(store.items).toBe(1);
		expect(store.summary).toBe('1 items');
	});
});
