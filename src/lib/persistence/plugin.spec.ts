import { describe, expect, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createPersistencePlugin } from './plugin.svelte.js';

describe('createPersistencePlugin', () => {
	it('rehydrates persisted state, flushes new snapshots, and clears stored state safely', async () => {
		const storage = new Map<string, string>([
			['counter', JSON.stringify({ version: 1, state: { count: 4 } })]
		]);
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
		const useCounterStore = defineStore('counter', {
			state: () => ({ count: 0 }),
			persist: {
				adapter,
				version: 1
			}
		} as {
			state: () => { count: number };
			persist: { adapter: typeof adapter; version: number };
		});
		const counter = useCounterStore(manager);

		await counter.$persist.ready;
		expect(counter.count).toBe(4);

		counter.count = 7;
		await counter.$persist.flush();
		expect(storage.get('counter')).toBe(JSON.stringify({ version: 1, state: { count: 7 } }));

		await counter.$persist.clear();
		expect(storage.has('counter')).toBe(false);
	});
});
