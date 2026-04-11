import { describe, expect, it } from 'vitest';
import { createHistoryPlugin } from './history/plugin.svelte.js';
import { createPersistencePlugin } from './persistence/plugin.svelte.js';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';
import { createSyncPlugin } from './sync/plugin.svelte.js';

describe('history runtime', () => {
	it('supports undo, redo, and replay without triggering persistence or sync side effects', async () => {
		const storage = new Map<string, string>();
		const published: unknown[] = [];
		const manager = createStateManager()
			.use(createPersistencePlugin())
			.use(createHistoryPlugin())
			.use(
				createSyncPlugin({
					origin: 'history-runtime-local',
					transports: [
						{
							publish(message) {
								published.push(message);
							},
							subscribe() {
								return () => {};
							},
							destroy() {}
						}
					]
				})
			);
		const useStore = defineStore('history-runtime-store', {
			state: () => ({ count: 0 }),
			history: { limit: 8 },
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
		store.count = 1;
		store.count = 2;
		await store.$persist.flush();

		const publishedBeforeReplay = published.length;
		const persistedBeforeReplay = storage.get('history-runtime-store');

		store.$history.undo();
		expect(store.count).toBe(1);
		store.$history.redo();
		expect(store.count).toBe(2);

		store.$timeTravel.goTo(0);
		expect(store.count).toBe(0);
		expect(published).toHaveLength(publishedBeforeReplay);
		expect(storage.get('history-runtime-store')).toBe(persistedBeforeReplay);
	});
});
