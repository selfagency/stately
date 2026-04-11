import { describe, expect, it } from 'vitest';
import { createStateManager } from '../root/create-state-manager.js';
import { defineStore } from '../define-store.svelte.js';
import { createSyncPlugin } from './plugin.svelte.js';

describe('createSyncPlugin', () => {
	it('publishes store snapshots and applies inbound messages for the same store', () => {
		const listeners = new Set<(message: unknown) => void>();
		const published: unknown[] = [];
		const transport = {
			publish(message: unknown) {
				published.push(message);
			},
			subscribe(listener: (message: unknown) => void) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
			destroy() {
				listeners.clear();
			}
		};
		const manager = createStateManager().use(
			createSyncPlugin({
				origin: 'local-origin',
				createId: () => 1,
				createTimestamp: () => 123,
				transports: [transport]
			})
		);
		const useCounterStore = defineStore('counter-sync', {
			state: () => ({ count: 0 })
		});
		const counter = useCounterStore(manager);

		counter.$patch({ count: 2 });

		expect(published[0]).toMatchObject({
			storeId: 'counter-sync',
			origin: 'local-origin',
			mutationId: 1,
			timestamp: 123,
			state: { count: 2 }
		});

		for (const listener of listeners) {
			listener({
				storeId: 'counter-sync',
				origin: 'remote-origin',
				mutationId: 2,
				timestamp: 456,
				version: 1,
				state: { count: 7 }
			});
		}

		expect(counter.count).toBe(7);

		for (const listener of listeners) {
			listener({
				storeId: 'counter-sync',
				origin: 'remote-origin',
				mutationId: 3,
				timestamp: 789,
				version: 1,
				state: null
			});
		}

		expect(counter.count).toBe(7);
	});
});
