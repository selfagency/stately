import type { StoreCustomProperties } from '../pinia-like/store-types.js';
import type { StateManagerPlugin } from '../root/types.js';
import { deserializePersistedState, serializePersistedState } from './serialize.js';
import type { PersistController, PersistOptions } from './types.js';

interface PersistableStore<State = Record<string, unknown>> {
	readonly $id: string;
	$state: State;
	$patch(patch: Partial<State> | ((state: State) => void)): void;
	$subscribe(callback: () => void): () => void;
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

function isReplayActive(store: PersistableStore): boolean {
	return (
		'$timeTravel' in store &&
		isRecord(store.$timeTravel) &&
		Reflect.get(store.$timeTravel, 'isReplaying') === true
	);
}

function readPersistOptions(value: unknown): PersistOptions | undefined {
	if (!isRecord(value) || !('persist' in value)) {
		return undefined;
	}

	const persist = value.persist;
	if (!isRecord(persist) || !('adapter' in persist)) {
		return undefined;
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
		const deserialize =
			persist.deserialize ?? ((raw: string) => deserializePersistedState(raw, persist));
		const compression = persist.compression;
		let paused = false;
		let rehydrating = false;

		const flush = async () => {
			if (paused || rehydrating || isReplayActive(store)) {
				return;
			}

			const snapshot = $state.snapshot(store.$state) as Record<string, unknown>;
			const payload = serialize({
				version: persist.version,
				state: snapshot
			});
			await persist.adapter.setItem(key, compression ? compression.compress(payload) : payload);
		};

		const rehydrate = async () => {
			const raw = await persist.adapter.getItem(key);
			if (!raw) {
				return false;
			}

			const source = compression ? compression.decompress(raw) : raw;
			if (!source) {
				return false;
			}

			const parsed = deserialize(source);
			if (!parsed) {
				return false;
			}

			rehydrating = true;
			store.$patch(parsed.state);
			rehydrating = false;
			return true;
		};

		const ready = rehydrate().then(() => undefined);
		const unsubscribe = store.$subscribe(() => {
			void flush();
		});
		const dispose = store.$dispose.bind(store);
		Object.defineProperty(store, '$dispose', {
			value() {
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
					await persist.adapter.removeItem(key);
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
