import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createPersistencePlugin } from './persistence/plugin.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

function createMapAdapter() {
	const storage = new Map<string, string>();
	return {
		storage,
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
	};
}

describe('persistence TTL expiration', () => {
	it('wraps persisted state in a timestamp envelope when ttl is set', async () => {
		const { storage, adapter } = createMapAdapter();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('ttl-wrap', {
			state: () => ({ count: 1 }),
			persist: { version: 1, adapter, ttl: 60_000 }
		});
		const store = useStore(manager);
		await store.$persist.ready;
		await store.$persist.flush();

		const raw = JSON.parse(storage.get('ttl-wrap')!);
		expect(raw).toHaveProperty('__stately_ttl');
		expect(typeof raw.__stately_ttl).toBe('number');
		expect(raw).toHaveProperty('data');
	});

	it('rehydrates successfully when TTL has not expired', async () => {
		const { storage, adapter } = createMapAdapter();
		const envelope = {
			__stately_ttl: Date.now() + 60_000,
			data: JSON.stringify({ version: 1, state: { count: 42 } })
		};
		storage.set('ttl-fresh', JSON.stringify(envelope));

		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('ttl-fresh', {
			state: () => ({ count: 0 }),
			persist: { version: 1, adapter, ttl: 60_000 }
		});
		const store = useStore(manager);
		await store.$persist.ready;

		expect(store.count).toBe(42);
	});

	it('discards persisted state when TTL has expired', async () => {
		const { storage, adapter } = createMapAdapter();
		const envelope = {
			__stately_ttl: Date.now() - 1000,
			data: JSON.stringify({ version: 1, state: { count: 99 } })
		};
		storage.set('ttl-expired', JSON.stringify(envelope));

		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('ttl-expired', {
			state: () => ({ count: 0 }),
			persist: { version: 1, adapter, ttl: 60_000 }
		});
		const store = useStore(manager);
		await store.$persist.ready;

		expect(store.count).toBe(0);
	});

	it('stores without TTL ignore TTL envelopes and read raw data', async () => {
		const { storage, adapter } = createMapAdapter();
		storage.set('no-ttl', JSON.stringify({ version: 1, state: { count: 7 } }));

		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('no-ttl', {
			state: () => ({ count: 0 }),
			persist: { version: 1, adapter }
		});
		const store = useStore(manager);
		await store.$persist.ready;

		expect(store.count).toBe(7);
	});
});
