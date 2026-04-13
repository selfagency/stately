import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createMemoryStorageAdapter } from '../persistence/adapters/memory-storage.js';
import { createStateManager } from '../root/create-state-manager.js';
import type { PersistStoreOptions } from './plugin-options.js';
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

	it('accepts interface-typed option store state without Record casts', () => {
		interface InterfaceState {
			count: number;
			label: string;
		}

		const manager = createStateManager();
		const useInterfaceStore = defineStore('interface-state-types', {
			state: (): InterfaceState => ({ count: 0, label: 'ready' }),
			persist: {
				adapter: createMemoryStorageAdapter(),
				version: 1
			},
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});

		const store = useInterfaceStore(manager);

		expectTypeOf(store.count).toEqualTypeOf<number>();
		expectTypeOf(store.label).toEqualTypeOf<string>();
		expectTypeOf(store.increment).toEqualTypeOf<() => void>();
		expectTypeOf(useInterfaceStore).toMatchTypeOf<
			StoreDefinition<'interface-state-types', InterfaceState, Record<never, never>, { increment: () => void }>
		>();
		expect(true).toBe(true);
	});

	it('types option-store action this as the full store instance', () => {
		interface AppState {
			count: number;
			label: string;
		}

		const manager = createStateManager();
		const useAppStateStore = defineStore('app-state-typing', {
			state: (): AppState => ({ count: 0, label: 'ready' }),
			actions: {
				merge(state: Partial<AppState>) {
					expectTypeOf(this.$id).toEqualTypeOf<'app-state-typing'>();
					expectTypeOf(this.$state).toEqualTypeOf<AppState>();
					expectTypeOf(this.$state.count).toEqualTypeOf<number>();
					expectTypeOf(this.$patch).toEqualTypeOf<(partial: Partial<AppState> | ((state: AppState) => void)) => void>();
					expectTypeOf(this.$reset).toEqualTypeOf<() => void>();
					expectTypeOf(this.$dispose).toEqualTypeOf<() => void>();
					expectTypeOf(this.set).toEqualTypeOf<(value: AppState) => void>();
					expectTypeOf(this.subscribe).toBeFunction();
					expectTypeOf(this.$subscribe).toBeFunction();
					expectTypeOf(this.$onAction).toBeFunction();
					const stop = this.$subscribe(() => undefined, { detached: true });
					stop();
					this.$patch(state);
					return this.$id;
				}
			}
		});

		const store = useAppStateStore(manager);
		const id = store.merge({ count: 1 });

		expect(id).toBe('app-state-typing');
		expect(store.count).toBe(1);
		expectTypeOf(store.merge).toBeFunction();
	});

	it('types subscribe selectors and equality functions consistently', () => {
		const manager = createStateManager();
		const useCounterStore = defineStore('selector-types', {
			state: () => ({ count: 0, label: 'ready' })
		});

		const counter = useCounterStore(manager);
		const unsubscribe = counter.$subscribe(() => undefined, {
			select: (state) => state.count,
			equalityFn(previous, next) {
				expectTypeOf(previous).toEqualTypeOf<number>();
				expectTypeOf(next).toEqualTypeOf<number>();
				return previous === next;
			}
		});

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

		const adapter = createMemoryStorageAdapter();
		// @ts-expect-error pick and omit are mutually exclusive
		const invalidPersistOptions: PersistStoreOptions<{ count: number; label: string }> = {
			adapter,
			version: 1,
			pick: ['count'],
			omit: ['label']
		};
		const invalidPersistDefinition = {
			state: () => ({ count: 0, label: 'ready' }),
			persist: {
				adapter,
				version: 1,
				pick: ['count'] as const,
				omit: ['label'] as const
			}
		};

		// @ts-expect-error pick and omit are mutually exclusive through defineStore persist typing too
		defineStore('invalid-persist-options', invalidPersistDefinition);

		expect(invalidPersistOptions).toBeDefined();

		expect(true).toBe(true);
	});

	it('preserves strong typing for setup-store overloads', () => {
		const manager = createStateManager();
		const useSetupStore = defineStore('setup-types', () => ({
			count: 0,
			label: 'ready',
			get summary() {
				return `${this.label}:${this.count}`;
			},
			increment(step: number) {
				this.count += step;
				return this.count;
			}
		}));
		const useSetupOptionsStore = defineStore('setup-options-types', {
			setup: () => ({
				enabled: true,
				toggle() {
					this.enabled = !this.enabled;
					return this.enabled;
				}
			})
		});

		const setupStore = useSetupStore(manager);
		const setupOptionsStore = useSetupOptionsStore(manager);

		expectTypeOf(setupStore.count).toEqualTypeOf<number>();
		expectTypeOf(setupStore.label).toEqualTypeOf<string>();
		expectTypeOf(setupStore.summary).toEqualTypeOf<string>();
		expectTypeOf(setupStore.increment).toEqualTypeOf<(step: number) => number>();
		expectTypeOf(setupOptionsStore.enabled).toEqualTypeOf<boolean>();
		expectTypeOf(setupOptionsStore.toggle).toEqualTypeOf<() => boolean>();
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
