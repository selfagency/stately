import { browser } from '$app/environment';
import {
	createAsyncPlugin,
	createFsmPlugin,
	createHistoryPlugin,
	createPersistencePlugin,
	createStateManager,
	createSyncPlugin,
	createValidationPlugin,
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

// ---------------------------------------------------------------------------
// FSM store — wizard with explicit lifecycle states
// ---------------------------------------------------------------------------

const _useWizardStore = defineStore('showcase-wizard', {
	state: () => ({ label: 'not started' }),
	fsm: {
		initial: 'idle',
		states: {
			idle: { start: 'running' },
			running: { pause: 'paused', finish: 'done', fail: 'failed' },
			paused: { resume: 'running', cancel: 'idle' },
			done: {},
			failed: { retry: 'running', cancel: 'idle' }
		}
	}
} as {
	state: () => { label: string };
	fsm: {
		initial: string;
		states: Record<string, Record<string, string>>;
	};
});

// ---------------------------------------------------------------------------
// Validation store — form that rejects negative counts
// ---------------------------------------------------------------------------

const _useFormStore = defineStore('showcase-form', {
	state: () => ({ quantity: 1, email: '' }),
	validate(state: { quantity: number; email: string }) {
		if (state.quantity < 1) return 'Quantity must be at least 1.';
		if (state.quantity > 99) return 'Quantity must be 99 or less.';
		if (state.email.length > 0 && !state.email.includes('@')) return 'Enter a valid email address.';
		return true;
	},
	actions: {
		setQuantity(this: { quantity: number }, value: number) {
			this.quantity = value;
		},
		setEmail(this: { email: string }, value: string) {
			this.email = value;
		}
	}
} as {
	state: () => { quantity: number; email: string };
	validate: (state: { quantity: number; email: string }) => boolean | string;
	actions: {
		setQuantity(value: number): void;
		setEmail(value: string): void;
	};
});

// ---------------------------------------------------------------------------
// Preferences store — persisted UI preferences for a second inspector target
// ---------------------------------------------------------------------------

const _preferencePersistence = createInspectablePersistence('showcase-preferences');

const _usePreferencesStore = defineStore('showcase-preferences', {
	state: () => ({ theme: 'light' as 'light' | 'dark', compact: false, fontSize: 14 }),
	persist: {
		adapter: _preferencePersistence.adapter,
		key: _preferencePersistence.key,
		version: 1
	},
	actions: {
		toggleTheme(this: { theme: 'light' | 'dark' }) {
			this.theme = this.theme === 'light' ? 'dark' : 'light';
		},
		setCompact(this: { compact: boolean }, value: boolean) {
			this.compact = value;
		},
		setFontSize(this: { fontSize: number }, size: number) {
			this.fontSize = Math.max(10, Math.min(24, size));
		}
	}
} as {
	state: () => { theme: 'light' | 'dark'; compact: boolean; fontSize: number };
	persist: { adapter: import('../lib/persistence/types.js').PersistenceAdapter; key: string; version: number };
	actions: {
		toggleTheme(): void;
		setCompact(value: boolean): void;
		setFontSize(size: number): void;
	};
});

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
	const fsmManager = createStateManager().use(createFsmPlugin());
	const formManager = createStateManager().use(createValidationPlugin());
	const preferencesManager = createStateManager().use(createPersistencePlugin());

	const primary = _useShowcaseStore(primaryManager);
	const peer = _useShowcaseStore(peerManager);
	const wizard = _useWizardStore(fsmManager);
	const form = _useFormStore(formManager);
	const preferences = _usePreferencesStore(preferencesManager);

	return {
		primary,
		peer,
		wizard,
		form,
		preferences,
		persistence: _showcasePersistence,
		loadCount(target: number) {
			return (primary.loadCount as unknown as (target: number) => Promise<number>)(target);
		},
		destroy() {
			primary.$dispose();
			peer.$dispose();
			wizard.$dispose();
			form.$dispose();
			preferences.$dispose();
		}
	};
}
