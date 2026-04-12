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

	it('sanitizes nested reserved keys in synced payload state', () => {
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

		const useStore = defineStore('sync-sanitize', {
			state: () => ({ profile: { name: 'initial' } })
		});
		const manager = createStateManager().use(createSyncPlugin({ origin: 'local', transports: [transport] }));
		const store = useStore(manager);
		const poisonedProfile = JSON.parse('{"name":"updated","__proto__":{"polluted":true}}') as Record<string, unknown>;

		for (const listener of listeners) {
			listener({
				storeId: 'sync-sanitize',
				origin: 'remote',
				version: 1,
				mutationId: 1,
				timestamp: Date.now(),
				state: {
					profile: poisonedProfile
				}
			});
		}

		expect(store.profile).toEqual({ name: 'updated' });
		expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
	});

	it('ignores messages whose origin matches the local origin (self-filter)', () => {
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

		const useStore = defineStore('sync-self-filter', {
			state: () => ({ count: 0 })
		});
		const manager = createStateManager().use(createSyncPlugin({ origin: 'self', transports: [transport] }));
		const store = useStore(manager);

		for (const listener of listeners) {
			listener({
				storeId: 'sync-self-filter',
				origin: 'self',
				version: 1,
				mutationId: 1,
				timestamp: Date.now(),
				state: { count: 99 }
			});
		}

		expect(store.count).toBe(0);
	});

	it('calls transport destroy on store dispose', () => {
		let destroyed = false;
		const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
			publish() {},
			subscribe() {
				return () => {};
			},
			destroy() {
				destroyed = true;
			}
		};

		const useStore = defineStore('sync-dispose', {
			state: () => ({ count: 0 })
		});
		const manager = createStateManager().use(createSyncPlugin({ origin: 'local', transports: [transport] }));
		const store = useStore(manager);

		store.$dispose();

		expect(destroyed).toBe(true);
	});

	it('tracks per-origin mutation IDs independently', () => {
		const aListeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
		const bListeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();

		const makeTransport = (
			senders: Set<(m: SyncMessage<Record<string, unknown>>) => void>
		): SyncTransport<SyncMessage<Record<string, unknown>>> => ({
			publish(message) {
				for (const listener of senders) {
					listener(message);
				}
			},
			subscribe(listener) {
				senders.add(listener);
				return () => senders.delete(listener);
			},
			destroy() {}
		});

		const useStore = defineStore('sync-per-origin', { state: () => ({ count: 0 }) });
		const manager = createStateManager().use(
			createSyncPlugin({ origin: 'local', transports: [makeTransport(aListeners), makeTransport(bListeners)] })
		);
		const store = useStore(manager);

		for (const listener of aListeners) {
			listener({
				storeId: 'sync-per-origin',
				origin: 'originA',
				version: 1,
				mutationId: 5,
				timestamp: Date.now(),
				state: { count: 5 }
			});
		}
		expect(store.count).toBe(5);

		// Lower mutationId from a different origin must still apply (tracked separately)
		for (const listener of bListeners) {
			listener({
				storeId: 'sync-per-origin',
				origin: 'originB',
				version: 1,
				mutationId: 1,
				timestamp: Date.now(),
				state: { count: 6 }
			});
		}
		expect(store.count).toBe(6);
	});
});
