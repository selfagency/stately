import type { PersistController } from '../../lib/persistence/types.js';

import {
	createLzStringCompression,
	createMemoryStorageAdapter,
	createPersistencePlugin,
	createStateManager,
	defineStore
} from '../../lib/index.js';

// Base store state shapes
type BasicState = { count: number; label: string };
type PickState = { count: number; transient: string };
type OmitState = { count: number; secret: string };
type CompressedState = { count: number; message: string };
type TtlState = { count: number };

type PersistStore<S extends object> = S & {
	$persist: PersistController;
	$reset(): void;
	$patch(patch: Partial<S> | ((state: S) => void)): void;
	$dispose(): void;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface PersistenceDemo {
	/** Basic memory adapter store */
	basicStore: PersistStore<BasicState>;
	/** Save the current state to the memory adapter */
	saveBasic(): Promise<void>;
	/** Restore state from the adapter */
	rehydrateBasic(): Promise<boolean>;
	/** Reset adapter and store */
	clearBasic(): Promise<void>;

	/** Pick-filtered store (only "count" is persisted) */
	pickStore: PersistStore<PickState>;
	savePickAndRehydrate(): Promise<void>;
	clearPick(): Promise<void>;

	/** Omit-filtered store ("secret" is excluded) */
	omitStore: PersistStore<OmitState>;
	saveOmitAndRehydrate(): Promise<void>;
	clearOmit(): Promise<void>;

	/** LZ-compressed store */
	compressedStore: PersistStore<CompressedState>;
	saveCompressed(): Promise<void>;
	saveAndRehydrateCompressed(): Promise<boolean | undefined>;
	rehydrateCompressed(): Promise<boolean>;
	rawCompressedValue(): Promise<string | null>;

	/** TTL store — expires in 2 s */
	ttlStore: PersistStore<TtlState>;
	saveTtl(): Promise<void>;
	isExpired: boolean;
	expire(): Promise<void>;

	/** Log lines displayed on the demo page */
	log: string[];

	destroy(): void;
}

export function createPersistenceDemo(): PersistenceDemo {
	// Adapter instances
	const basicAdapter = createMemoryStorageAdapter();
	const pickAdapter = createMemoryStorageAdapter();
	const omitAdapter = createMemoryStorageAdapter();
	const compressedAdapter = createMemoryStorageAdapter();
	const ttlAdapter = createMemoryStorageAdapter();

	const log: string[] = $state([]);
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const push = (msg: string) => log.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);

	// Managers
	const basicManager = createStateManager().use(createPersistencePlugin());
	const pickManager = createStateManager().use(createPersistencePlugin());
	const omitManager = createStateManager().use(createPersistencePlugin());
	const compressedManager = createStateManager().use(createPersistencePlugin());
	const ttlManager = createStateManager().use(createPersistencePlugin());

	// Store definitions with persist options (per instance)
	const _useBasicStore = defineStore('persist-basic', {
		state: () => ({ count: 0, label: 'hello' }),
		persist: { adapter: basicAdapter, version: 1 }
	});
	const _usePickStore = defineStore('persist-pick', {
		state: () => ({ count: 0, transient: 'not stored' }),
		persist: { adapter: pickAdapter, version: 1, pick: ['count'] as const }
	});
	const _useOmitStore = defineStore('persist-omit', {
		state: () => ({ count: 0, secret: 'not stored' }),
		persist: { adapter: omitAdapter, version: 1, omit: ['secret'] as const }
	});
	const _useCompressedStore = defineStore('persist-compressed', {
		state: () => ({ count: 0, message: 'compressed storage' }),
		persist: {
			adapter: compressedAdapter,
			version: 1,
			compression: createLzStringCompression()
		}
	});
	const _useTtlStore = defineStore('persist-ttl', {
		state: () => ({ count: 0 }),
		persist: { adapter: ttlAdapter, version: 1, ttl: 2000 }
	});

	// Instantiate stores
	const basicStore = _useBasicStore(basicManager);
	const pickStore = _usePickStore(pickManager);
	const omitStore = _useOmitStore(omitManager);
	const compressedStore = _useCompressedStore(compressedManager);
	const ttlStore = _useTtlStore(ttlManager);

	let isExpired = $state(false);

	return {
		basicStore,
		async saveBasic() {
			await basicStore.$persist.flush();
			push(`Saved: count=${basicStore.count}, label="${basicStore.label}"`);
		},
		async rehydrateBasic() {
			const restored = await basicStore.$persist.rehydrate();
			push(`Rehydrated: success=${restored}`);
			return restored;
		},
		async clearBasic() {
			await basicStore.$persist.clear();
			basicStore.$reset();
			push('Cleared adapter & reset store');
		},

		pickStore,
		async savePickAndRehydrate() {
			// Modify transient, save, reset, then rehydrate — transient should go back to default
			const prevTransient = pickStore.transient;
			await pickStore.$persist.flush();
			pickStore.$reset();
			await pickStore.$persist.rehydrate();
			push(
				`After rehydrate: count=${pickStore.count}, transient="${pickStore.transient}" (was "${prevTransient}", not persisted)`
			);
		},
		async clearPick() {
			await pickStore.$persist.clear();
			pickStore.$reset();
			push('Pick store cleared');
		},

		omitStore,
		async saveOmitAndRehydrate() {
			const prevSecret = omitStore.secret;
			await omitStore.$persist.flush();
			omitStore.$reset();
			await omitStore.$persist.rehydrate();
			push(
				`After rehydrate: count=${omitStore.count}, secret="${omitStore.secret}" (was "${prevSecret}", not persisted)`
			);
		},
		async clearOmit() {
			await omitStore.$persist.clear();
			omitStore.$reset();
			push('Omit store cleared');
		},

		compressedStore,
		async saveCompressed() {
			await compressedStore.$persist.flush();
			push('Saved with LZ-string compression');
		},
		async saveAndRehydrateCompressed() {
			await compressedStore.$persist.flush();
			compressedStore.$persist.pause();
			compressedStore.$reset();
			compressedStore.$persist.resume();
			const restored = await compressedStore.$persist.rehydrate();
			push(`Compressed cycle: success=${restored}, count=${compressedStore.count}`);
			return restored;
		},
		async rehydrateCompressed() {
			const restored = await compressedStore.$persist.rehydrate();
			push(`Rehydrated compressed: success=${restored}, count=${compressedStore.count}`);
			return restored;
		},
		async rawCompressedValue() {
			return await compressedAdapter.getItem('persist-compressed');
		},

		ttlStore,
		get isExpired() {
			return isExpired;
		},
		async saveTtl() {
			await ttlStore.$persist.flush();
			isExpired = false;
			push('Saved TTL entry (expires in 2 s)');
		},
		async expire() {
			// Clear the adapter — simulates rehydrating after expiry by reading back expired data
			// We use a 0-ms TTL adapter write to fake an expired entry
			const key = 'persist-ttl';
			const raw = await ttlAdapter.getItem(key);
			if (raw) {
				// Tamper the stored timestamp to be in the past
				try {
					const parsed = JSON.parse(raw) as Record<string, unknown>;
					if (parsed && typeof parsed === 'object') {
						(parsed as Record<string, unknown>).__stately_ttl = 0;
						await ttlAdapter.setItem(key, JSON.stringify(parsed));
					}
				} catch {
					// ignore
				}
			}
			const restored = await ttlStore.$persist.rehydrate();
			isExpired = !restored;
			push(`Rehydrated after tampered TTL: success=${restored} (expected false)`);
		},

		log,

		destroy() {
			basicStore.$dispose();
			pickStore.$dispose();
			omitStore.$dispose();
			compressedStore.$dispose();
			ttlStore.$dispose();
		}
	};
}
