import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createPersistencePlugin } from './persistence/plugin.svelte.js';
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
});
