import type { StateManagerPlugin } from '../root/types.js';
import { createBroadcastChannelTransport } from './broadcast-channel.js';
import { createStorageEventTransport } from './storage-events.js';
import type { SyncMessage, SyncTransport } from './types.js';

interface SyncStore<State = Record<string, unknown>> {
	readonly $id: string;
	$state: State;
	$patch(patch: Partial<State> | ((state: State) => void)): void;
	$subscribe(callback: () => void): () => void;
	$dispose(): void;
}

export interface SyncPluginOptions<Message extends SyncMessage = SyncMessage> {
	origin?: string;
	version?: number;
	channelName?: string;
	storageKey?: string;
	transports?: SyncTransport<Message>[];
	createId?: () => number;
	createTimestamp?: () => number;
}

function createOrigin(): string {
	return globalThis.crypto?.randomUUID?.() ?? `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isSyncStore(value: unknown): value is SyncStore {
	return typeof value === 'object' && value !== null && '$subscribe' in value && '$patch' in value;
}

export function createSyncPlugin<Message extends SyncMessage = SyncMessage>(
	options: SyncPluginOptions<Message> = {}
): StateManagerPlugin {
	const origin = options.origin ?? createOrigin();
	const version = options.version ?? 1;
	const createId = options.createId ?? (() => Date.now());
	const createTimestamp = options.createTimestamp ?? (() => Date.now());

	return ({ store }) => {
		if (!isSyncStore(store)) {
			return;
		}

		const transports =
			options.transports ??
			([
				createBroadcastChannelTransport<Message>(options.channelName ?? 'stately-sync', { origin }),
				createStorageEventTransport<Message>(options.storageKey ?? 'stately-sync', {
					origin,
					window: typeof window === 'undefined' ? undefined : window,
					storage: typeof localStorage === 'undefined' ? undefined : localStorage
				})
			] as SyncTransport<Message>[]);

		let applyingRemote = false;
		let lastSeenMutationId = 0;

		const unsubscribeRemote = transports.map((transport) =>
			transport.subscribe((message) => {
				if (message.storeId !== store.$id || message.origin === origin) {
					return;
				}

				if (message.mutationId <= lastSeenMutationId) {
					return;
				}

				lastSeenMutationId = message.mutationId;
				applyingRemote = true;
				store.$patch(message.state);
				applyingRemote = false;
			})
		);

		const unsubscribeStore = store.$subscribe(() => {
			if (applyingRemote) {
				return;
			}

			lastSeenMutationId += 1;
			const message = {
				storeId: store.$id,
				origin,
				version,
				mutationId: options.createId ? createId() : lastSeenMutationId,
				timestamp: createTimestamp(),
				state: $state.snapshot(store.$state)
			} as Message;

			for (const transport of transports) {
				transport.publish(message);
			}
		});

		const dispose = store.$dispose.bind(store);
		Object.defineProperty(store, '$dispose', {
			value() {
				unsubscribeStore();
				for (const unsubscribe of unsubscribeRemote) {
					unsubscribe();
				}
				for (const transport of transports) {
					transport.destroy();
				}
				dispose();
			},
			enumerable: false,
			configurable: false,
			writable: false
		});
		return undefined;
	};
}
