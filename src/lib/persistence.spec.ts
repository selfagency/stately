import { describe, expect, it, vi } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createPersistencePlugin } from './persistence/plugin.svelte.js';
import type { JsonObject } from './persistence/types.js';
import { createStateManager } from './root/create-state-manager.js';

describe('persistence runtime', () => {
	it('supports manual save, paused writes, restore, and clear through the public controller', async () => {
		const storage = new Map<string, string>();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-runtime', {
			state: () => ({ count: 0 }),
			persist: {
				version: 1,
				adapter: {
					async getItem(key: string) {
						return storage.get(key) ?? null;
					},
					async setItem(key: string, value: string) {
						storage.set(key, value);
					},
					async removeItem(key: string) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);

		await store.$persist.ready;
		store.count = 2;
		await store.$persist.flush();
		expect(storage.get('persistence-runtime')).toBe(JSON.stringify({ version: 1, state: { count: 2 } }));

		store.$persist.pause();
		store.count = 7;
		expect(storage.get('persistence-runtime')).toBe(JSON.stringify({ version: 1, state: { count: 2 } }));

		await store.$persist.rehydrate();
		store.$persist.resume();
		expect(store.count).toBe(2);

		await store.$persist.clear();
		expect(storage.has('persistence-runtime')).toBe(false);
	});

	it('survives a QuotaExceededError from the storage adapter without crashing the store', async () => {
		const storage = new Map<string, string>();
		let shouldThrow = false;
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-quota', {
			state: () => ({ count: 0 }),
			persist: {
				version: 1,
				adapter: {
					async getItem(key: string) {
						return storage.get(key) ?? null;
					},
					async setItem(_key: string, _value: string) {
						if (shouldThrow) {
							throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
						}
						storage.set(_key, _value);
					},
					async removeItem(key: string) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		store.count = 1;
		await store.$persist.flush();
		expect(storage.get('persistence-quota')).toBe(JSON.stringify({ version: 1, state: { count: 1 } }));

		shouldThrow = true;
		store.count = 2;
		await expect(store.$persist.flush()).rejects.toThrow('Storage quota exceeded');

		expect(store.count).toBe(2);
		expect(storage.get('persistence-quota')).toBe(JSON.stringify({ version: 1, state: { count: 1 } }));
	});

	it('handles corrupted storage data gracefully on rehydrate', async () => {
		const storage = new Map<string, string>();
		storage.set('persistence-corrupt', '<<<NOT JSON>>>');
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-corrupt', {
			state: () => ({ count: 42 }),
			persist: {
				version: 1,
				adapter: {
					async getItem(key: string) {
						return storage.get(key) ?? null;
					},
					async setItem(key: string, value: string) {
						storage.set(key, value);
					},
					async removeItem(key: string) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		expect(store.count).toBe(42);
	});

	it('surfaces flush errors via the onError callback when provided', async () => {
		const errors: unknown[] = [];
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-onerror', {
			state: () => ({ count: 0 }),
			persist: {
				version: 1,
				onError(err) {
					errors.push(err);
				},
				adapter: {
					async getItem() {
						return null;
					},
					async setItem() {
						throw new Error('disk full');
					},
					async removeItem() {}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		store.count = 1;
		await store.$persist.flush().catch(() => {});

		// The auto-flush from $subscribe should also have tried and called onError.
		// flush() itself rejects, but the auto-triggered flush routes to onError.
		// We verify at least one error was reported.
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0]).toBeInstanceOf(Error);
	});

	it('debounces auto-flush writes and only persists the final state', async () => {
		vi.useFakeTimers();
		const writes: string[] = [];
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-debounce', {
			state: () => ({ count: 0 }),
			persist: {
				version: 1,
				debounce: 100,
				adapter: {
					async getItem() {
						return null;
					},
					async setItem(_key, value) {
						writes.push(value);
					},
					async removeItem() {}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		store.count = 1;
		store.count = 2;
		store.count = 3;

		// No writes yet — debounce window still open
		expect(writes).toHaveLength(0);

		await vi.runAllTimersAsync();

		// Only one write after the debounce window closes
		expect(writes).toHaveLength(1);
		expect(writes[0]).toBe(JSON.stringify({ version: 1, state: { count: 3 } }));

		vi.useRealTimers();
	});

	it('round-trips state through a custom compression adapter', async () => {
		const storage = new Map<string, string>();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-compression', {
			state: () => ({ label: '' }),
			persist: {
				version: 1,
				compression: {
					compress: (v) => `compressed:${v}`,
					decompress: (v) => (v.startsWith('compressed:') ? v.slice('compressed:'.length) : undefined)
				},
				adapter: {
					async getItem(key) {
						return storage.get(key) ?? null;
					},
					async setItem(key, value) {
						storage.set(key, value);
					},
					async removeItem(key) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		store.label = 'hello';
		await store.$persist.flush();

		const raw = storage.get('persistence-compression');
		expect(raw).toMatch(/^compressed:/);

		// New store instance reading from the same storage — must use a fresh
		// manager to avoid the cached instance and actually test rehydration.
		const rehydrationManager = createStateManager().use(createPersistencePlugin());
		const store2 = useStore(rehydrationManager);
		await store2.$persist.ready;
		expect(store2.label).toBe('hello');
	});

	it('applies a custom deserializer and sanitizes its output', async () => {
		const storage = new Map<string, string>();
		const manager = createStateManager().use(createPersistencePlugin());
		const raw = JSON.stringify({ version: 1, state: { count: 7 } });
		storage.set('persistence-custom-deser', raw);

		const useStore = defineStore('persistence-custom-deser', {
			state: () => ({ count: 0 }),
			persist: {
				version: 1,
				deserialize(source) {
					return JSON.parse(source) as { version: number; state: JsonObject };
				},
				adapter: {
					async getItem(key) {
						return storage.get(key) ?? null;
					},
					async setItem(key, value) {
						storage.set(key, value);
					},
					async removeItem(key) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		expect(store.count).toBe(7);
	});

	it('runs the migrate function when stored version differs from current version', async () => {
		const storage = new Map<string, string>();
		storage.set('persistence-migrate', JSON.stringify({ version: 1, state: { legacyField: 42 } }));

		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-migrate', {
			state: () => ({ count: 0 }),
			persist: {
				version: 2,
				migrate(storedState) {
					const legacy = storedState as { legacyField: number };
					return { count: legacy.legacyField };
				},
				adapter: {
					async getItem(key) {
						return storage.get(key) ?? null;
					},
					async setItem(key, value) {
						storage.set(key, value);
					},
					async removeItem(key) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		expect(store.count).toBe(42);
	});

	it('uses a custom key option instead of the store ID', async () => {
		const storage = new Map<string, string>();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-custom-key-store', {
			state: () => ({ value: 'hello' }),
			persist: {
				version: 1,
				key: 'my-custom-key',
				adapter: {
					async getItem(key) {
						return storage.get(key) ?? null;
					},
					async setItem(key, value) {
						storage.set(key, value);
					},
					async removeItem(key) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		store.value = 'world';
		await store.$persist.flush();

		expect(storage.has('persistence-custom-key-store')).toBe(false);
		expect(storage.get('my-custom-key')).toBe(JSON.stringify({ version: 1, state: { value: 'world' } }));
	});

	it('uses a custom serialize function for writing', async () => {
		const storage = new Map<string, string>();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-custom-serialize', {
			state: () => ({ n: 0 }),
			persist: {
				version: 1,
				serialize: (envelope) => `CUSTOM:${JSON.stringify(envelope)}`,
				adapter: {
					async getItem(key) {
						return storage.get(key) ?? null;
					},
					async setItem(key, value) {
						storage.set(key, value);
					},
					async removeItem(key) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		store.n = 5;
		await store.$persist.flush();

		const saved = storage.get('persistence-custom-serialize');
		expect(saved).toMatch(/^CUSTOM:/);
	});

	it('pause() stops auto-flush; resume() re-enables writes', async () => {
		const storage = new Map<string, string>();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('persistence-pause-flush', {
			state: () => ({ count: 0 }),
			persist: {
				version: 1,
				adapter: {
					async getItem(key) {
						return storage.get(key) ?? null;
					},
					async setItem(key, value) {
						storage.set(key, value);
					},
					async removeItem(key) {
						storage.delete(key);
					}
				}
			}
		});
		const store = useStore(manager);
		await store.$persist.ready;

		store.count = 1;
		await store.$persist.flush();
		const snap1 = storage.get('persistence-pause-flush');

		store.$persist.pause();
		store.count = 99;

		// Auto-flush is suppressed during pause
		expect(storage.get('persistence-pause-flush')).toBe(snap1);

		// Manual flush is also suppressed during pause (by design)
		await store.$persist.flush();
		expect(storage.get('persistence-pause-flush')).toBe(snap1);

		// After resume, a manual flush writes the latest state
		store.$persist.resume();
		await store.$persist.flush();
		expect(storage.get('persistence-pause-flush')).toBe(JSON.stringify({ version: 1, state: { count: 99 } }));
	});
});
