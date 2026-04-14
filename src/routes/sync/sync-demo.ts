import { createStateManager, createSyncPlugin, defineStore } from '../../lib/index.js';
import type { SyncMessage, SyncTransport } from '../../lib/sync/types.js';

// ---------------------------------------------------------------------------
// Shared counter store definition
// ---------------------------------------------------------------------------

const _useSyncCounterStore = defineStore('sync-counter', {
	state: () => ({ count: 0 })
});

// ---------------------------------------------------------------------------
// In-memory sync bus — simulates cross-tab messaging in one page
// ---------------------------------------------------------------------------

function createSyncBus<Message>() {
	const listeners = new Set<(message: Message) => void>();
	return {
		createTransport(): SyncTransport<Message> {
			return {
				publish(message) {
					for (const listener of listeners) listener(message);
				},
				subscribe(listener) {
					listeners.add(listener);
					return () => listeners.delete(listener);
				},
				destroy() {}
			};
		}
	};
}

// ---------------------------------------------------------------------------
// BroadcastChannel sync — two peers on the same channel
// ---------------------------------------------------------------------------

function createBroadcastTransport(channelName: string): SyncTransport<SyncMessage<object>> {
	let channel: BroadcastChannel | null = null;
	let messageHandler: ((event: MessageEvent) => void) | null = null;

	return {
		publish(message) {
			if (!channel) return;
			channel.postMessage(message);
		},
		subscribe(listener) {
			if (typeof globalThis.BroadcastChannel === 'undefined') return () => {};
			channel = new BroadcastChannel(channelName);
			messageHandler = (event: MessageEvent) => listener(event.data as SyncMessage<object>);
			channel.addEventListener('message', messageHandler);
			return () => {
				if (messageHandler) channel?.removeEventListener('message', messageHandler);
				channel?.close();
				channel = null;
			};
		},
		destroy() {
			if (messageHandler) channel?.removeEventListener('message', messageHandler);
			channel?.close();
			channel = null;
		}
	};
}

export function createSyncDemo() {
	// In-memory sync pair
	const memBus = createSyncBus<SyncMessage<{ count: number }>>();
	const primaryMemManager = createStateManager().use(
		createSyncPlugin({ origin: 'sync-primary-mem', transports: [memBus.createTransport()] })
	);
	const peerMemManager = createStateManager().use(
		createSyncPlugin({ origin: 'sync-peer-mem', transports: [memBus.createTransport()] })
	);
	const memPrimary = _useSyncCounterStore(primaryMemManager);
	const memPeer = _useSyncCounterStore(peerMemManager);

	// BroadcastChannel sync pair
	const bcChannelName = 'stately-demo-sync-' + Math.random().toString(36).slice(2);
	const primaryBcManager = createStateManager().use(
		createSyncPlugin({
			origin: 'sync-primary-bc',
			transports: [createBroadcastTransport(bcChannelName)]
		})
	);
	const peerBcManager = createStateManager().use(
		createSyncPlugin({
			origin: 'sync-peer-bc',
			transports: [createBroadcastTransport(bcChannelName)]
		})
	);
	const bcPrimary = _useSyncCounterStore(primaryBcManager);
	const bcPeer = _useSyncCounterStore(peerBcManager);

	return {
		memPrimary,
		memPeer,
		bcPrimary,
		bcPeer,
		destroy() {
			memPrimary.$dispose();
			memPeer.$dispose();
			bcPrimary.$dispose();
			bcPeer.$dispose();
		}
	};
}
