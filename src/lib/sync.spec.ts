import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';
import { createSyncPlugin } from './sync/plugin.svelte.js';
import type { SyncMessage, SyncTransport } from './sync/types.js';

describe('sync runtime', () => {
	it('keeps stores in separate managers synchronized in both directions', () => {
		const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
		const transportFactory = (): SyncTransport<SyncMessage<Record<string, unknown>>> => ({
			publish(message) {
				for (const listener of listeners) {
					listener(message);
				}
			},
			subscribe(listener) {
				listeners.add(listener);
				return () => {
					listeners.delete(listener);
				};
			},
			destroy() {}
		});
		const useStore = defineStore('sync-runtime-store', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});
		const firstManager = createStateManager().use(
			createSyncPlugin({ origin: 'first', transports: [transportFactory()] })
		);
		const secondManager = createStateManager().use(
			createSyncPlugin({ origin: 'second', transports: [transportFactory()] })
		);
		const first = useStore(firstManager);
		const second = useStore(secondManager);

		first.increment();
		expect(second.count).toBe(1);

		second.increment();
		expect(first.count).toBe(2);
	});

	it('filters unknown keys from remote state during sync', () => {
		const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
		const transportFactory = (): SyncTransport<SyncMessage<Record<string, unknown>>> => ({
			publish(message) {
				for (const listener of listeners) {
					listener(message);
				}
			},
			subscribe(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
			destroy() {}
		});

		const useSmall = defineStore('sync-small', {
			state: () => ({ count: 0 })
		});
		const useLarge = defineStore('sync-small', {
			state: () => ({ count: 0, extra: 'injected', secret: 42 }),
			actions: {
				setAll() {
					this.count = 99;
					this.extra = 'malicious';
					this.secret = 0;
				}
			}
		});

		const receiverManager = createStateManager().use(
			createSyncPlugin({ origin: 'receiver', transports: [transportFactory()] })
		);
		const senderManager = createStateManager().use(
			createSyncPlugin({ origin: 'sender', transports: [transportFactory()] })
		);

		const receiver = useSmall(receiverManager);
		const sender = useLarge(senderManager);

		sender.setAll();
		expect(receiver.count).toBe(99);
		expect('extra' in receiver).toBe(false);
		expect('secret' in receiver).toBe(false);
	});

	it('ignores stale mutations based on mutationId', () => {
		const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
		const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
			publish(message) {
				for (const listener of listeners) {
					listener(message);
				}
			},
			subscribe(listener) {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
			destroy() {}
		};

		const useStore = defineStore('sync-stale', {
			state: () => ({ count: 0 })
		});
		const manager = createStateManager().use(createSyncPlugin({ origin: 'local', transports: [transport] }));
		const store = useStore(manager);

		for (const listener of listeners) {
			listener({
				storeId: 'sync-stale',
				origin: 'remote',
				version: 1,
				mutationId: 10,
				timestamp: Date.now(),
				state: { count: 5 }
			});
		}
		expect(store.count).toBe(5);

		for (const listener of listeners) {
			listener({
				storeId: 'sync-stale',
				origin: 'remote',
				version: 1,
				mutationId: 5,
				timestamp: Date.now(),
				state: { count: 999 }
			});
		}
		expect(store.count).toBe(5);
	});
});
