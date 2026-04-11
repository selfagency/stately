import { describe, expect, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createPersistencePlugin } from './plugin.svelte.js';

describe('createPersistencePlugin', () => {
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
		storage.set(
			'counter',
			compression.compress(JSON.stringify({ version: 1, state: { count: 4 } }))
		);
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
});
