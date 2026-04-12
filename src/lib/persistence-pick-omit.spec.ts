import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createPersistencePlugin } from './persistence/plugin.svelte.js';
import type { PersistOptions } from './persistence/types.js';
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

describe('persistence pick/omit', () => {
	it('pick persists only the specified keys', async () => {
		const { storage, adapter } = createMapAdapter();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('pick-test', {
			state: () => ({ name: 'Alice', age: 30, secret: 'hidden' }),
			persist: { version: 1, adapter, pick: ['name', 'age'] }
		});
		const store = useStore(manager);
		await store.$persist.ready;
		await store.$persist.flush();

		const raw = JSON.parse(storage.get('pick-test')!);
		expect(raw.state).toEqual({ name: 'Alice', age: 30 });
		expect(raw.state).not.toHaveProperty('secret');
	});

	it('omit excludes the specified keys from persistence', async () => {
		const { storage, adapter } = createMapAdapter();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('omit-test', {
			state: () => ({ name: 'Bob', age: 25, token: 'sensitive' }),
			persist: { version: 1, adapter, omit: ['token'] }
		});
		const store = useStore(manager);
		await store.$persist.ready;
		await store.$persist.flush();

		const raw = JSON.parse(storage.get('omit-test')!);
		expect(raw.state).toEqual({ name: 'Bob', age: 25 });
		expect(raw.state).not.toHaveProperty('token');
	});

	it('rehydrate with pick only restores picked keys, leaving others at initial values', async () => {
		const { storage, adapter } = createMapAdapter();
		storage.set('pick-restore', JSON.stringify({ version: 1, state: { name: 'Stored', age: 99 } }));

		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('pick-restore', {
			state: () => ({ name: 'Default', age: 0, extra: 'untouched' }),
			persist: { version: 1, adapter, pick: ['name', 'age'] }
		});
		const store = useStore(manager);
		await store.$persist.ready;

		expect(store.name).toBe('Stored');
		expect(store.age).toBe(99);
		expect(store.extra).toBe('untouched');
	});

	it('pick and omit cannot be used together', () => {
		const { adapter } = createMapAdapter();
		const manager = createStateManager().use(createPersistencePlugin());
		const useStore = defineStore('pick-omit-error', {
			state: () => ({ a: 1, b: 2 }),
			persist: {
				version: 1,
				adapter,
				pick: ['a'],
				omit: ['b']
			} as PersistOptions<{ a: number; b: number }>
		});

		expect(() => useStore(manager)).toThrow(/pick.*omit/i);
	});
});
