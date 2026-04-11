import { describe, expect, it } from 'vitest';
import { createStateManager } from '../root/create-state-manager.js';
import { defineStore } from '../define-store.svelte.js';
import { createSyncPlugin } from './plugin.svelte.js';
import type { SyncMessage, SyncTransport } from './types.js';

describe('createSyncPlugin', () => {
	it('publishes store snapshots and applies inbound messages for the same store', () => {
		const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
		const published: unknown[] = [];
		const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
			publish(message) {
				published.push(message);
			},
			subscribe(listener) {
				listeners.add(listener);
				return () => {
					listeners.delete(listener);
				};
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
			} as unknown as SyncMessage<Record<string, unknown>>);
		}

		expect(counter.count).toBe(7);
	});

	it('rejects inbound messages with a mismatched version', () => {
		const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
		const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
			publish() {},
			subscribe(listener) {
				listeners.add(listener);
				return () => {
					listeners.delete(listener);
				};
			},
			destroy() {
				listeners.clear();
			}
		};
		const manager = createStateManager().use(
			createSyncPlugin({ origin: 'local', version: 2, transports: [transport] })
		);
		const useStore = defineStore('ver-check-store', { state: () => ({ count: 0 }) });
		const store = useStore(manager);

		for (const listener of listeners) {
			listener({
				storeId: 'ver-check-store',
				origin: 'remote',
				mutationId: 1,
				timestamp: 1,
				version: 1,
				state: { count: 99 }
			});
		}
		expect(store.count).toBe(0);

		for (const listener of listeners) {
			listener({
				storeId: 'ver-check-store',
				origin: 'remote',
				mutationId: 2,
				timestamp: 2,
				version: 2,
				state: { count: 42 }
			});
		}
		expect(store.count).toBe(42);
	});

	it('leaves $dispose configurable so multiple plugins can chain cleanup', () => {
		const destroyed: string[] = [];
		const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
			publish() {},
			subscribe() {
				return () => {};
			},
			destroy() {
				destroyed.push('transport');
			}
		};
		const manager = createStateManager().use(createSyncPlugin({ origin: 'local', transports: [transport] }));
		const useStore = defineStore('dispose-chain-store', { state: () => ({ v: 0 }) });
		const store = useStore(manager);

		const previousDispose = store.$dispose.bind(store);
		Object.defineProperty(store, '$dispose', {
			value() {
				destroyed.push('outer');
				previousDispose();
			},
			configurable: true,
			writable: true,
			enumerable: false
		});

		store.$dispose();
		expect(destroyed).toEqual(['outer', 'transport']);
	});
});
