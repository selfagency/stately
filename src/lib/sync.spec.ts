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
});
