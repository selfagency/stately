import type { StateManagerPlugin } from '../root/types.js';
import { SvelteSet } from 'svelte/reactivity';
import type { StoreMutationContext } from '../pinia-like/store-types.js';
import { sanitizeValue } from '../internal/sanitize.js';
import { createBroadcastChannelTransport } from './broadcast-channel.js';
import { parseSyncMessage } from './message-schema.js';
import { createStorageEventTransport } from './storage-events.js';
import type { SyncMessage, SyncTransport } from './types.js';

interface SyncStore<State = Record<string, unknown>> {
	readonly $id: string;
	$state: State;
	$patch(patch: Partial<State> | ((state: State) => void)): void;
	$subscribe(callback: (mutation: StoreMutationContext, state: State) => void): () => void;
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isReplayActive(store: SyncStore): boolean {
	return (
		'$timeTravel' in store && isRecord(store.$timeTravel) && Reflect.get(store.$timeTravel, 'isReplaying') === true
	);
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

		if (typeof window === 'undefined' && !options.transports) {
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

		const knownStateKeys = new SvelteSet(Object.keys(store.$state));

		function filterToKnownKeys(remote: Record<string, unknown>): Record<string, unknown> | undefined {
			const filtered: Record<string, unknown> = {};
			let hasKnownKey = false;
			for (const key of Object.keys(remote)) {
				if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
				if (knownStateKeys.has(key)) {
					filtered[key] = sanitizeValue(Reflect.get(remote, key));
					hasKnownKey = true;
				}
			}
			return hasKnownKey ? filtered : undefined;
		}

		const unsubscribeRemote = transports.map((transport) =>
			transport.subscribe((message) => {
				try {
					const parsed = parseSyncMessage(message);
					if (!parsed) {
						return;
					}

					if (parsed.storeId !== store.$id || parsed.origin === origin) {
						return;
					}

					if (parsed.version !== version) {
						return;
					}

					if (parsed.mutationId <= lastSeenMutationId) {
						return;
					}

					const validatedState = filterToKnownKeys(parsed.state);
					if (!validatedState) {
						return;
					}

					lastSeenMutationId = parsed.mutationId;
					applyingRemote = true;
					store.$patch(validatedState);
					applyingRemote = false;
				} catch {
					applyingRemote = false;
				}
			})
		);

		const unsubscribeStore = store.$subscribe(() => {
			if (applyingRemote || isReplayActive(store)) {
				return;
			}

			const mutationId = options.createId ? createId() : lastSeenMutationId + 1;
			lastSeenMutationId = mutationId;
			const message = {
				storeId: store.$id,
				origin,
				version,
				mutationId,
				timestamp: createTimestamp(),
				state: $state.snapshot(store.$state)
			} as Message;

			for (const transport of transports) {
				try {
					transport.publish(message);
				} catch {
					// Non-serializable or transport failure — skip silently
				}
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
			configurable: true,
			writable: true
		});
		return undefined;
	};
}
