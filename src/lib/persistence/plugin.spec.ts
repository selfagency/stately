import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createPersistencePlugin } from './plugin.svelte.js';
import type { PersistEnvelope } from './types.js';

describe('createPersistencePlugin', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('rehydrates persisted state, flushes new snapshots, and clears stored state safely', async () => {
		const storage = new Map<string, string>();
		const adapter = {
			async getItem(key: string) {
				return storage.get(key) ?? null;
			},
			async setItem(key: string, value: string) {
				storage.set(key, value);
			},
			async removeItem(key: string) {
				storage.delete(key);
			}
		};
		const compression = {
			compress(value: string) {
				return `c:${value}`;
			},
			decompress(value: string) {
				return value.startsWith('c:') ? value.slice(2) : undefined;
			}
		};
		storage.set('counter', compression.compress(JSON.stringify({ version: 1, state: { count: 4 } })));
		const manager = createStateManager().use(createPersistencePlugin());
		const useCounterStore = defineStore('counter', {
			state: () => ({ count: 0 }),
			persist: {
				adapter,
				version: 1,
				compression
			}
		} as {
			state: () => { count: number };
			persist: { adapter: typeof adapter; version: number; compression: typeof compression };
		});
		const counter = useCounterStore(manager);

		await counter.$persist.ready;
		expect(counter.count).toBe(4);

		counter.count = 7;
		await counter.$persist.flush();
		expect(storage.get('counter')).toBe(`c:${JSON.stringify({ version: 1, state: { count: 7 } })}`);

		await counter.$persist.clear();
		expect(storage.has('counter')).toBe(false);
	});

	it('serializes queued writes so stale snapshots cannot overwrite newer persisted state', async () => {
		const storage = new Map<string, string>();
		let releaseFirstWrite: (() => void) | undefined;
		const firstWrite = new Promise<void>((resolve) => {
			releaseFirstWrite = resolve;
		});
		const adapter = {
			async getItem(key: string) {
				return storage.get(key) ?? null;
			},
			async setItem(key: string, value: string) {
				if (value.includes('"count":1')) {
					await firstWrite;
				}
				storage.set(key, value);
			},
			async removeItem(key: string) {
				storage.delete(key);
			}
		};
		const manager = createStateManager().use(createPersistencePlugin());
		const useCounterStore = defineStore('queued-counter', {
			state: () => ({ count: 0 }),
			persist: {
				adapter,
				version: 1
			}
		});
		const counter = useCounterStore(manager);

		counter.count = 1;
		const firstFlush = counter.$persist.flush();
		counter.count = 2;
		const secondFlush = counter.$persist.flush();

		releaseFirstWrite?.();
		await Promise.all([firstFlush, secondFlush]);

		expect(storage.get('queued-counter')).toBe(JSON.stringify({ version: 1, state: { count: 2 } }));
	});

	it('cancels any pending debounced flush before clearing persisted state', async () => {
		vi.useFakeTimers();

		const storage = new Map<string, string>();
		const adapter = {
			async getItem(key: string) {
				return storage.get(key) ?? null;
			},
			async setItem(key: string, value: string) {
				storage.set(key, value);
			},
			async removeItem(key: string) {
				storage.delete(key);
			}
		};
		const manager = createStateManager().use(createPersistencePlugin());
		const useCounterStore = defineStore('debounced-clear-counter', {
			state: () => ({ count: 0 }),
			persist: {
				adapter,
				version: 1,
				debounce: 50
			}
		});
		const counter = useCounterStore(manager);

		counter.count = 1;
		await counter.$persist.clear();

		await vi.advanceTimersByTimeAsync(50);
		await Promise.resolve();
		await Promise.resolve();

		expect(storage.has('debounced-clear-counter')).toBe(false);
	});

	it('throws a clear error for invalid persist version configuration', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const useCounterStore = defineStore('invalid-persist-counter', {
			state: () => ({ count: 0 }),
			persist: {
				adapter: {
					async getItem() {
						return null;
					},
					async setItem() {},
					async removeItem() {}
				}
			}
		} as never);

		expect(() => useCounterStore(manager)).toThrow(/persist configuration: version/i);
	});

	it('throws for non-string key', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-key', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, key: 42 }
		} as never);
		expect(() => useStore(manager)).toThrow(/key must be a string/i);
	});

	it('throws for non-array pick', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-pick', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, pick: 'count' }
		} as never);
		expect(() => useStore(manager)).toThrow(/pick must be an array/i);
	});

	it('throws for non-array omit', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-omit', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, omit: 'count' }
		} as never);
		expect(() => useStore(manager)).toThrow(/omit must be an array/i);
	});

	it('throws for invalid compression shape', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-compression', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, compression: { compress: 'bad' } }
		} as never);
		expect(() => useStore(manager)).toThrow(/compression must implement compress and decompress/i);
	});

	it('throws for non-function serialize', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-serialize', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, serialize: 'not-a-fn' }
		} as never);
		expect(() => useStore(manager)).toThrow(/serialize must be a function/i);
	});

	it('throws for non-function deserialize', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-deserialize', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, deserialize: 42 }
		} as never);
		expect(() => useStore(manager)).toThrow(/deserialize must be a function/i);
	});

	it('throws for non-function migrate', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-migrate', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, migrate: true }
		} as never);
		expect(() => useStore(manager)).toThrow(/migrate must be a function/i);
	});

	it('throws for non-function onError', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-onerror', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, onError: 'nope' }
		} as never);
		expect(() => useStore(manager)).toThrow(/onError must be a function/i);
	});

	it('throws for non-finite debounce', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-debounce', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, debounce: NaN }
		} as never);
		expect(() => useStore(manager)).toThrow(/debounce must be a finite number/i);
	});

	it('throws for non-finite ttl', () => {
		const manager = createStateManager().use(createPersistencePlugin());
		const adapter = {
			async getItem() {
				return null;
			},
			async setItem() {},
			async removeItem() {}
		};
		const useStore = defineStore('invalid-ttl', {
			state: () => ({ count: 0 }),
			persist: { adapter, version: 1, ttl: Infinity }
		} as never);
		expect(() => useStore(manager)).toThrow(/ttl must be a finite number/i);
	});

	it('preserves interface-based state types through custom serialize and deserialize hooks', async () => {
		interface PersistedState {
			count: number;
			label: string;
		}

		const storage = new Map<string, string>();
		const adapter = {
			async getItem(key: string) {
				return storage.get(key) ?? null;
			},
			async setItem(key: string, value: string) {
				storage.set(key, value);
			},
			async removeItem(key: string) {
				storage.delete(key);
			}
		};
		let serializedEnvelope: PersistEnvelope<PersistedState> | undefined;
		storage.set('typed-persist-hooks', JSON.stringify({ version: 1, state: { count: 4, label: 'loaded' } }));

		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('typed-persist-hooks', {
			state: (): PersistedState => ({ count: 0, label: 'init' }),
			persist: {
				adapter,
				version: 1,
				serialize(envelope) {
					expectTypeOf(envelope.state.count).toEqualTypeOf<number>();
					expectTypeOf(envelope.state.label).toEqualTypeOf<string>();
					serializedEnvelope = envelope;
					return JSON.stringify(envelope);
				},
				deserialize(raw) {
					const envelope = JSON.parse(raw) as PersistEnvelope<PersistedState>;
					expectTypeOf(envelope.state.count).toEqualTypeOf<number>();
					expectTypeOf(envelope.state.label).toEqualTypeOf<string>();
					return envelope;
				}
			}
		});
		const store = useStore(manager);

		await store.$persist.ready;
		expect(store.count).toBe(4);
		expect(store.label).toBe('loaded');

		store.$patch({ count: 6, label: 'saved' });
		await store.$persist.flush();
		expect(serializedEnvelope?.state).toEqual({ count: 6, label: 'saved' });
	});
});
