import { reportStatelyInspectorNotice } from '../inspector/notice.js';
import { sanitizeValue } from '../internal/sanitize.js';
import type { StoreCustomProperties, StoreMutationContext } from '../pinia-like/store-types.js';
import type { StateManagerPlugin } from '../root/types.js';
import { deserializePersistedState, serializePersistedState } from './serialize.js';
import type { PersistController, PersistOptions, PersistenceAdapter } from './types.js';

interface PersistableStore<State = Record<string, unknown>> {
	readonly $id: string;
	$state: State;
	$patch(patch: Partial<State> | ((state: State) => void)): void;
	$subscribe(callback: (mutation: StoreMutationContext, state: State) => void): () => void;
	$dispose(): void;
}

declare module '../pinia-like/store-types.js' {
	interface StoreCustomProperties {
		$persist: PersistController;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isPersistableStore(value: unknown): value is PersistableStore {
	return isRecord(value) && '$state' in value && '$patch' in value && '$subscribe' in value;
}

function isPersistenceAdapter(value: unknown): value is PersistenceAdapter {
	return (
		isRecord(value) &&
		typeof value.getItem === 'function' &&
		typeof value.setItem === 'function' &&
		typeof value.removeItem === 'function'
	);
}

function isReplayActive(store: PersistableStore): boolean {
	return (
		'$timeTravel' in store && isRecord(store.$timeTravel) && Reflect.get(store.$timeTravel, 'isReplaying') === true
	);
}

function readPersistOptions(value: unknown): PersistOptions | undefined {
	if (!isRecord(value) || !('persist' in value)) {
		return undefined;
	}

	const persist = value.persist;
	if (!isRecord(persist)) {
		return undefined;
	}

	if (!isPersistenceAdapter(persist.adapter)) {
		throw new Error('Invalid persist configuration: adapter must implement getItem, setItem, and removeItem.');
	}

	if (typeof persist.version !== 'number' || !Number.isFinite(persist.version)) {
		throw new Error('Invalid persist configuration: version must be a finite number.');
	}

	return persist as unknown as PersistOptions;
}

export function createPersistencePlugin(): StateManagerPlugin {
	return ({ options, store }) => {
		if (!isPersistableStore(store)) {
			return;
		}

		const persist = readPersistOptions(options);
		if (!persist) {
			return;
		}

		const key = persist.key ?? store.$id;
		const serialize = persist.serialize ?? serializePersistedState;
		const customDeserialize = persist.deserialize;
		const compression = persist.compression;
		let paused = false;
		let rehydrating = false;
		let flushQueue = Promise.resolve();
		let debounceTimer: ReturnType<typeof setTimeout> | undefined;

		// flush() resolves when the write it enqueued completes, but does NOT wait for
		// previously-enqueued writes that were already in-flight. Callers that need a full
		// drain should await $persist.flush() in a loop until flushQueue settles, or simply
		// call $persist.flush() from an async action after ensuring all mutations are done.
		const flush = async () => {
			if (paused || rehydrating || isReplayActive(store)) {
				return;
			}

			const snapshot = $state.snapshot(store.$state) as Record<string, unknown>;
			const payload = serialize({
				version: persist.version,
				state: snapshot
			});

			let encoded: string;
			try {
				encoded = compression ? compression.compress(payload) : payload;
			} catch {
				reportStatelyInspectorNotice(`Compression failed for store "${store.$id}". Falling back to uncompressed.`);
				encoded = payload;
			}

			const queuedWrite = flushQueue
				.catch(() => undefined)
				.then(async () => {
					await persist.adapter.setItem(key, encoded);
				});
			flushQueue = queuedWrite;
			return queuedWrite;
		};

		const rehydrate = async () => {
			const raw = await persist.adapter.getItem(key);
			if (!raw) {
				return false;
			}

			let source: string | undefined;
			try {
				source = compression ? compression.decompress(raw) : raw;
			} catch {
				reportStatelyInspectorNotice(`Decompression failed for store "${store.$id}".`);
				return false;
			}

			if (!source) {
				return false;
			}

			if (customDeserialize) {
				const parsed = customDeserialize(source);
				if (!parsed) {
					return false;
				}
				rehydrating = true;
				try {
					store.$patch(sanitizeValue(parsed.state) as Partial<typeof store.$state>);
					return true;
				} finally {
					rehydrating = false;
				}
			}

			const result = deserializePersistedState(source, persist);
			if (!result.ok) {
				reportStatelyInspectorNotice(`Rehydration failed for store "${store.$id}": ${result.error}`);
				return false;
			}

			rehydrating = true;
			try {
				store.$patch(result.envelope.state);
				return true;
			} finally {
				rehydrating = false;
			}
		};

		const ready = rehydrate().then(() => undefined);
		const handleFlushError = (error: unknown) => {
			if (persist.onError) {
				persist.onError(error);
			} else {
				reportStatelyInspectorNotice(`Flush failed for store "${store.$id}": ${String(error)}`);
			}
		};
		const unsubscribe = store.$subscribe(() => {
			const doFlush = () => void flush().catch(handleFlushError);
			if (persist.debounce) {
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(doFlush, persist.debounce);
			} else {
				doFlush();
			}
		});
		const dispose = store.$dispose.bind(store);
		Object.defineProperty(store, '$dispose', {
			value() {
				clearTimeout(debounceTimer);
				unsubscribe();
				dispose();
			},
			enumerable: false,
			configurable: true,
			writable: true
		});

		return {
			$persist: {
				ready,
				flush,
				rehydrate,
				async clear() {
					const wasPaused = paused;
					paused = true;
					await flushQueue.catch(() => undefined);
					await persist.adapter.removeItem(key);
					flushQueue = Promise.resolve();
					paused = wasPaused;
				},
				pause() {
					paused = true;
				},
				resume() {
					paused = false;
				}
			} satisfies PersistController
		} satisfies Partial<StoreCustomProperties>;
	};
}
