/**
 * Smoke + behaviour tests for the public examples.
 * These ensure example code compiles, initialises cleanly, and behaves as
 * documented — so the showcase and docs don't give users bad advice.
 *
 * Note: Each test creates a fresh manager to avoid shared singleton state
 * between tests. The module-level manager exports (historyManager, etc.) are
 * left as-is — they exist to mirror real-world usage in docs snippets.
 */

import { describe, expect, it } from 'vitest';
import {
	createAsyncPlugin,
	createHistoryPlugin,
	createPersistencePlugin,
	createStateManager,
	createSyncPlugin
} from '../index.js';
import type { SyncMessage, SyncTransport } from '../sync/types.js';
import { useCounterStore } from './option-store/counter.js';
import { useAsyncCounterStore } from './plugins/async.js';
import { useDraftStore } from './plugins/history.js';
import { usePreferencesStore as usePersistentPreferencesStore } from './plugins/persistence.js';
import { createSyncedManager, usePresenceStore } from './plugins/sync.js';
import { usePreferencesStore } from './setup-store/preferences.svelte.js';

// ---------------------------------------------------------------------------
// Option store — counter
// ---------------------------------------------------------------------------

describe('example: option store (counter)', () => {
	it('starts with count 0 and step 1', () => {
		const store = useCounterStore(createStateManager());
		expect(store.count).toBe(0);
		expect(store.step).toBe(1);
	});

	it('increment adds step to count', () => {
		const store = useCounterStore(createStateManager());
		store.increment();
		expect(store.count).toBe(1);
	});

	it('setStep changes the increment size', () => {
		const store = useCounterStore(createStateManager());
		store.setStep(5);
		store.increment();
		expect(store.count).toBe(5);
	});

	it('doubleCount getter returns count * 2', () => {
		const store = useCounterStore(createStateManager());
		store.increment();
		expect(store.doubleCount).toBe(2);
	});

	it('multiple increments accumulate correctly', () => {
		const store = useCounterStore(createStateManager());
		store.setStep(3);
		store.increment();
		store.increment();
		expect(store.count).toBe(6);
		expect(store.doubleCount).toBe(12);
	});
});

// ---------------------------------------------------------------------------
// Setup store — preferences
// ---------------------------------------------------------------------------

describe('example: setup store (preferences)', () => {
	it('starts with light theme and compact false', () => {
		const store = usePreferencesStore(createStateManager());
		expect(store.theme).toBe('light');
		expect(store.compact).toBe(false);
	});

	it('toggleTheme switches light → dark', () => {
		const store = usePreferencesStore(createStateManager());
		store.toggleTheme();
		expect(store.theme).toBe('dark');
	});

	it('toggleTheme switches dark → light', () => {
		const store = usePreferencesStore(createStateManager());
		store.toggleTheme();
		store.toggleTheme();
		expect(store.theme).toBe('light');
	});

	it('setCompact(true) sets compact flag', () => {
		const store = usePreferencesStore(createStateManager());
		store.setCompact(true);
		expect(store.compact).toBe(true);
	});

	it('setCompact(false) clears compact flag', () => {
		const store = usePreferencesStore(createStateManager());
		store.setCompact(true);
		store.setCompact(false);
		expect(store.compact).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// History plugin — draft store
// ---------------------------------------------------------------------------

describe('example: history plugin (draft store)', () => {
	const freshManager = () => createStateManager().use(createHistoryPlugin());

	it('starts with count 0', () => {
		const store = useDraftStore(freshManager());
		expect(store.count).toBe(0);
	});

	it('increment adds 1 to count', () => {
		const store = useDraftStore(freshManager());
		store.increment();
		expect(store.count).toBe(1);
	});

	it('undo reverts an increment', () => {
		const store = useDraftStore(freshManager());
		store.increment();
		store.$history.undo();
		expect(store.count).toBe(0);
	});

	it('redo re-applies an undone increment', () => {
		const store = useDraftStore(freshManager());
		store.increment();
		store.$history.undo();
		store.$history.redo();
		expect(store.count).toBe(1);
	});

	it('history grows after each mutation', () => {
		const store = useDraftStore(freshManager());
		const initial = store.$history.entries.length;
		store.increment();
		store.increment();
		expect(store.$history.entries.length).toBe(initial + 2);
	});
});

// ---------------------------------------------------------------------------
// Persistence plugin — preferences store
// ---------------------------------------------------------------------------

describe('example: persistence plugin (preferences store)', () => {
	const freshManager = () => createStateManager().use(createPersistencePlugin());

	it('starts with default theme dark and compact false', () => {
		const store = usePersistentPreferencesStore(freshManager());
		expect(store.theme).toBe('dark');
		expect(store.compact).toBe(false);
	});

	it('$patch updates state immediately', () => {
		const store = usePersistentPreferencesStore(freshManager());
		store.$patch({ theme: 'light' });
		expect(store.theme).toBe('light');
	});

	it('$reset restores default theme', () => {
		const store = usePersistentPreferencesStore(freshManager());
		store.$patch({ theme: 'light' });
		store.$reset();
		expect(store.theme).toBe('dark');
	});

	it('exposes $persist ready promise', () => {
		const store = usePersistentPreferencesStore(freshManager());
		expect(store.$persist).toBeDefined();
		expect(store.$persist.ready).toBeInstanceOf(Promise);
	});
});

// ---------------------------------------------------------------------------
// Async plugin — async counter
// ---------------------------------------------------------------------------

describe('example: async plugin (async counter store)', () => {
	const freshManager = () =>
		createStateManager().use(
			createAsyncPlugin({
				include: ['loadCount'],
				policies: { loadCount: 'restartable' },
				injectSignal(signal, args) {
					return [signal, ...args];
				}
			})
		);

	it('starts with count 0', () => {
		const store = useAsyncCounterStore(freshManager());
		expect(store.count).toBe(0);
	});

	it('exposes $async tracking object for loadCount', () => {
		const store = useAsyncCounterStore(freshManager());
		expect(store.$async).toBeDefined();
		expect(typeof store.$async.loadCount.isLoading).toBe('boolean');
	});

	it('loadCount resolves and sets the count', async () => {
		const store = useAsyncCounterStore(freshManager());
		// injectSignal prepends the AbortSignal at runtime; callers only pass target
		await (store.loadCount as unknown as (target: number) => Promise<number>)(42);
		expect(store.count).toBe(42);
	});

	it('isLoading is true while loadCount is pending', async () => {
		const store = useAsyncCounterStore(freshManager());
		// injectSignal prepends the AbortSignal at runtime; callers only pass target
		const pending = (store.loadCount as unknown as (target: number) => Promise<number>)(7);
		expect(store.$async.loadCount.isLoading).toBe(true);
		await pending;
		expect(store.$async.loadCount.isLoading).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Sync plugin — presence store
// ---------------------------------------------------------------------------

describe('example: sync plugin (presence store)', () => {
	it('createSyncedManager returns a manager', () => {
		const mgr = createSyncedManager('tab-a');
		expect(mgr).toBeDefined();
	});

	it('store starts with count 0', () => {
		const mgr = createSyncedManager('solo');
		const store = usePresenceStore(mgr);
		expect(store.count).toBe(0);
	});

	it('increment updates count locally', () => {
		const mgr = createSyncedManager('solo');
		const store = usePresenceStore(mgr);
		store.increment();
		expect(store.count).toBe(1);
	});

	it('two peers with a shared in-process transport sync mutations', () => {
		type Msg = SyncMessage<Record<string, unknown>>;
		// Each peer has a transport that cross-forwards to the other's receive handler
		let receiveA: ((msg: Msg) => void) | null = null;
		let receiveB: ((msg: Msg) => void) | null = null;

		const transportA: SyncTransport<Msg> = {
			publish(msg: Msg) {
				receiveB?.(msg);
			},
			subscribe(handler: (msg: Msg) => void) {
				receiveA = handler;
				return () => {
					receiveA = null;
				};
			},
			destroy() {}
		};
		const transportB: SyncTransport<Msg> = {
			publish(msg: Msg) {
				receiveA?.(msg);
			},
			subscribe(handler: (msg: Msg) => void) {
				receiveB = handler;
				return () => {
					receiveB = null;
				};
			},
			destroy() {}
		};

		const mgrA = createStateManager().use(
			createSyncPlugin({ origin: 'peer-a', channelName: 'test', transports: [transportA] })
		);
		const mgrB = createStateManager().use(
			createSyncPlugin({ origin: 'peer-b', channelName: 'test', transports: [transportB] })
		);

		const storeA = usePresenceStore(mgrA);
		const storeB = usePresenceStore(mgrB);

		storeA.increment();

		// Peer B should receive the patch published by peer A
		expect(storeB.count).toBe(1);
	});
});
