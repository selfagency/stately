import { browser } from '$app/environment';
import {
	createAsyncPlugin,
	createHistoryPlugin,
	createPersistencePlugin,
	createStateManager,
	createSyncPlugin,
	defineStore
} from '../lib/index.js';
import { createLocalStorageAdapter } from '../lib/persistence/adapters/local-storage.js';
import { createMemoryStorageAdapter } from '../lib/persistence/adapters/memory-storage.js';
import type { PersistenceAdapter } from '../lib/persistence/types.js';
import type { SyncMessage, SyncTransport } from '../lib/sync/types.js';

let nextShowcaseId = 1;

const SHOWCASE_STORE_ID = 'showcase-counter';
const _showcasePersistence = createInspectablePersistence(SHOWCASE_STORE_ID);

const _useShowcaseStore = defineStore(SHOWCASE_STORE_ID, {
	state: () => ({ count: 0, note: 'Fresh demo state' }),
	getters: {
		doubleCount(state: { count: number }) {
			return state.count * 2;
		}
	},
	actions: {
		increment(this: { count: number; note: string }, amount = 1) {
			this.count += amount;
			this.note = amount === 1 ? 'Incremented by one' : `Incremented by ${amount}`;
		},
		async loadCount(this: { count: number; note: string }, signal: AbortSignal, target: number) {
			this.note = `Loading ${target}`;
			await wait(225, signal);
			this.count = target;
			this.note = `Loaded ${target}`;
			return target;
		}
	},
	persist: {
		adapter: _showcasePersistence.adapter,
		key: _showcasePersistence.key,
		version: 1
	},
	history: {
		limit: 12
	}
} as {
	state: () => { count: number; note: string };
	getters: { doubleCount(state: { count: number }): number };
	actions: {
		increment(amount?: number): void;
		loadCount(signal: AbortSignal, target: number): Promise<number>;
	};
	persist: { adapter: PersistenceAdapter; key: string; version: number };
	history: { limit: number };
});

function createAbortError(): Error {
	if (typeof DOMException !== 'undefined') {
		return new DOMException('The operation was aborted.', 'AbortError');
	}

	return Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(createAbortError());
			return;
		}

		const timeout = setTimeout(() => {
			signal.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timeout);
			signal.removeEventListener('abort', onAbort);
			reject(createAbortError());
		};

		signal.addEventListener('abort', onAbort, { once: true });
	});
}

function createSyncBus<Message>() {
	const listeners = new Set<(message: Message) => void>();

	return {
		createTransport(): SyncTransport<Message> {
			return {
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
			};
		}
	};
}

function createInspectablePersistence(storeId: string) {
	const key = `stately:showcase:${storeId}`;
	const fallback = createMemoryStorageAdapter();

	const adapter: PersistenceAdapter = {
		getItem(targetKey) {
			return browser ? createLocalStorageAdapter().getItem(targetKey) : fallback.getItem(targetKey);
		},
		setItem(targetKey, value) {
			return browser ? createLocalStorageAdapter().setItem(targetKey, value) : fallback.setItem(targetKey, value);
		},
		removeItem(targetKey) {
			return browser ? createLocalStorageAdapter().removeItem(targetKey) : fallback.removeItem(targetKey);
		}
	};

	return {
		key,
		adapter,
		read() {
			return adapter.getItem(key);
		}
	};
}

export function createShowcaseDemo() {
	const instanceId = nextShowcaseId++;
	const syncBus = createSyncBus<SyncMessage<{ count: number; note: string }>>();
	const primaryManager = createStateManager()
		.use(createPersistencePlugin())
		.use(createHistoryPlugin())
		.use(
			createSyncPlugin({
				origin: `${SHOWCASE_STORE_ID}:primary:${instanceId}`,
				transports: [syncBus.createTransport()]
			})
		)
		.use(
			createAsyncPlugin({
				include: ['loadCount'],
				policies: { loadCount: 'restartable' },
				injectSignal(signal: AbortSignal, args: unknown[]) {
					return [signal, ...args];
				}
			})
		);
	const peerManager = createStateManager().use(
		createSyncPlugin({
			origin: `${SHOWCASE_STORE_ID}:peer:${instanceId}`,
			transports: [syncBus.createTransport()]
		})
	);
	const primary = _useShowcaseStore(primaryManager);
	const peer = _useShowcaseStore(peerManager);

	return {
		primary,
		peer,
		persistence: _showcasePersistence,
		loadCount(target: number) {
			return (primary.loadCount as unknown as (target: number) => Promise<number>)(target);
		},
		destroy() {
			primary.$dispose();
			peer.$dispose();
		}
	};
}
