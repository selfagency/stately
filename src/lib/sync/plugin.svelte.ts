import { sanitizeValue } from '../internal/sanitize.js';
import type { StoreMutationContext, StoreState } from '../pinia-like/store-types.js';
import type { StateManagerPlugin } from '../root/types.js';
import { createBroadcastChannelTransport } from './broadcast-channel.js';
import { parseSyncMessage } from './message-schema.js';
import { createStorageEventTransport } from './storage-events.js';
import type { SyncMessage, SyncTransport } from './types.js';

interface SyncStore<State extends object = StoreState> {
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
	/**
	 * Produce the outgoing `Message` from a fully-populated `SyncMessage` base.
	 * The callback is manager-wide, so its input is intentionally state-agnostic.
	 * Required when `Message` extends `SyncMessage` with additional fields; omit when
	 * `Message` is exactly `SyncMessage`.
	 */
	createMessage?: (base: SyncMessage<object>) => Message;
}

interface SyncMutationClock {
	origin: string;
	mutationId: number;
	timestamp: number;
}

const MAX_TRACKED_ORIGINS = 128;

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

function compareOriginsDeterministically(left: string, right: string): number {
	if (left === right) {
		return 0;
	}

	return left < right ? -1 : 1;
}

function compareSyncMutationClocks(left: SyncMutationClock, right: SyncMutationClock): number {
	if (left.timestamp !== right.timestamp) {
		return left.timestamp - right.timestamp;
	}

	if (left.origin !== right.origin) {
		return compareOriginsDeterministically(left.origin, right.origin);
	}

	return left.mutationId - right.mutationId;
}

function rememberOriginMutation(receivedMutationIds: Map<string, number>, origin: string, mutationId: number): void {
	if (receivedMutationIds.has(origin)) {
		receivedMutationIds.delete(origin);
	}

	receivedMutationIds.set(origin, mutationId);

	if (receivedMutationIds.size > MAX_TRACKED_ORIGINS) {
		const oldestOrigin = receivedMutationIds.keys().next().value;
		if (oldestOrigin) {
			receivedMutationIds.delete(oldestOrigin);
		}
	}
}

export function createSyncPlugin<Message extends SyncMessage = SyncMessage>(
	options: SyncPluginOptions<Message> = {}
): StateManagerPlugin {
	const origin = options.origin ?? createOrigin();
	const version = options.version ?? 1;
	const createId = options.createId;
	const createTimestamp = options.createTimestamp ?? (() => Date.now());

	return ({ store }) => {
		if (!isSyncStore(store)) {
			return;
		}
		const syncedStore = store;

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
		let nextOutgoingId = 0;
		let latestAppliedClock: SyncMutationClock | undefined;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- plain Map; used in event handler closures, not reactive context
		const receivedMutationIds = new Map<string, number>();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- plain Set; used for key lookup only, not reactive
		const knownStateKeys = new Set(Object.keys(syncedStore.$state as Record<string, unknown>));

		function filterToKnownKeys(remote: object): Partial<typeof syncedStore.$state> | undefined {
			const filtered: Record<string, unknown> = {};
			let hasKnownKey = false;
			for (const key of Object.keys(remote)) {
				if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
				if (knownStateKeys.has(key)) {
					filtered[key] = sanitizeValue(Reflect.get(remote, key));
					hasKnownKey = true;
				}
			}
			return hasKnownKey ? (filtered as Partial<typeof syncedStore.$state>) : undefined;
		}

		const unsubscribeRemote = transports.map((transport) =>
			transport.subscribe((message) => {
				try {
					const parsed = parseSyncMessage(message);
					if (!parsed) {
						return;
					}

					if (parsed.storeId !== syncedStore.$id || parsed.origin === origin) {
						return;
					}

					if (parsed.version !== version) {
						return;
					}

					const lastReceived = receivedMutationIds.get(parsed.origin) ?? 0;
					if (parsed.mutationId <= lastReceived) {
						return;
					}

					const incomingClock = {
						origin: parsed.origin,
						mutationId: parsed.mutationId,
						timestamp: parsed.timestamp
					} satisfies SyncMutationClock;

					if (latestAppliedClock && compareSyncMutationClocks(incomingClock, latestAppliedClock) <= 0) {
						rememberOriginMutation(receivedMutationIds, parsed.origin, parsed.mutationId);
						return;
					}

					const validatedState = filterToKnownKeys(parsed.state);
					if (!validatedState) {
						return;
					}

					applyingRemote = true;
					try {
						syncedStore.$patch(validatedState);
						latestAppliedClock = incomingClock;
						rememberOriginMutation(receivedMutationIds, parsed.origin, parsed.mutationId);
					} finally {
						applyingRemote = false;
					}
				} catch {
					// Message parse or validation error — skip silently
				}
			})
		);

		const unsubscribeStore = syncedStore.$subscribe(() => {
			if (applyingRemote || isReplayActive(syncedStore)) {
				return;
			}

			const mutationId = createId ? createId() : ++nextOutgoingId;
			const timestamp = createTimestamp();
			const base = {
				storeId: syncedStore.$id,
				origin,
				version,
				mutationId,
				timestamp,
				state: $state.snapshot(syncedStore.$state) as typeof syncedStore.$state
			} satisfies SyncMessage<object>;
			const message: Message = options.createMessage ? options.createMessage(base) : (base as Message);
			latestAppliedClock = {
				origin,
				mutationId,
				timestamp
			};

			for (const transport of transports) {
				try {
					transport.publish(message);
				} catch {
					// Non-serializable or transport failure — skip silently
				}
			}
		});

		const dispose = syncedStore.$dispose.bind(syncedStore);
		Object.defineProperty(syncedStore, '$dispose', {
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
