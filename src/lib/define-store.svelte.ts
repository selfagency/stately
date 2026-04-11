import { SvelteMap } from 'svelte/reactivity';
import { createOptionStore } from './runtime/create-option-store.svelte.js';
import { getDefaultStateManager } from './root/create-state-manager.js';
import type { StateManager, StoreDefinition } from './root/types.js';
import type {
	DefineStoreOptionsBase,
	StoreActions,
	StoreDefinition as PublicStoreDefinition,
	StoreGetters,
	StoreInstance,
	StoreState
} from './pinia-like/store-types.js';

type AnyRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type GetterTree<State extends AnyRecord> = StoreGetters<Record<string, (state: State) => unknown>>;
type ActionTree = StoreActions<Record<string, AnyFunction>>;

export interface DefineStoreOptions<
	State extends AnyRecord,
	Getters extends GetterTree<State>,
	Actions extends ActionTree
> extends DefineStoreOptionsBase<
	StoreState<State>,
	StoreInstance<
		string,
		StoreState<State>,
		{ readonly [K in keyof Getters]: ReturnType<Getters[K]> },
		StoreActions<Actions>
	>
> {
	state: () => State;
	getters?: Getters &
		ThisType<State & { readonly [K in keyof Getters]: ReturnType<Getters[K]> } & Actions>;
	actions?: Actions &
		ThisType<State & { readonly [K in keyof Getters]: ReturnType<Getters[K]> } & Actions>;
}

type StoreFromSetup<Store extends AnyRecord, Id extends string> = Store & { readonly $id: Id };

type SetupStoreFactory<Store extends AnyRecord> = () => Store;

const registeredDefinitionIds = new SvelteMap<string, StoreDefinition>();

function isRecord(value: unknown): value is AnyRecord {
	return typeof value === 'object' && value !== null;
}

function isFunction(value: unknown): value is AnyFunction {
	return typeof value === 'function';
}

function isOptionStoreDefinition(
	value: unknown
): value is DefineStoreOptions<AnyRecord, GetterTree<AnyRecord>, ActionTree> {
	return isRecord(value) && isFunction((value as DefineStoreOptions<AnyRecord, GetterTree<AnyRecord>, ActionTree>).state);
}

function assertValidStoreId(id: string): void {
	if (!id.trim()) {
		throw new Error('Invalid store definition: store id must be a non-empty string.');
	}
}

function assertValidStoreDefinition(
	id: string,
	definition: unknown
): asserts definition is
	| DefineStoreOptions<AnyRecord, GetterTree<AnyRecord>, ActionTree>
	| SetupStoreFactory<AnyRecord> {
	if (!isOptionStoreDefinition(definition) && !isFunction(definition)) {
		throw new Error(
			`Invalid store definition for "${id}". Expected an options object or setup function.`
		);
	}
}

function registerDefinition(definition: StoreDefinition): void {
	const existing = registeredDefinitionIds.get(definition.$id);
	if (existing) {
		throw new Error(`Duplicate store definition registered for "${definition.$id}".`);
	}
	registeredDefinitionIds.set(definition.$id, definition);
}

function addStoreId<Store extends AnyRecord, Id extends string>(store: Store, id: Id): Store & { readonly $id: Id } {
	Object.defineProperty(store, '$id', {
		value: id,
		enumerable: true,
		configurable: false,
		writable: false
	});

	return store as Store & { readonly $id: Id };
}

function createSetupStore<Store extends AnyRecord, Id extends string>(
	id: Id,
	setup: SetupStoreFactory<Store>
): StoreFromSetup<Store, Id> {
	const store = setup();

	if (!isRecord(store)) {
		throw new Error(
			`Invalid setup store definition for "${id}". Setup stores must return an object.`
		);
	}

	for (const [key, value] of Object.entries(store)) {
		if (isFunction(value)) {
			Reflect.set(store, key, value.bind(store));
		}
	}

	return addStoreId(store, id);
}

export function defineStore<
	Id extends string,
	State extends AnyRecord,
	Getters extends GetterTree<State> = GetterTree<State>,
	Actions extends ActionTree = ActionTree
>(
	id: Id,
	options: DefineStoreOptions<State, Getters, Actions>
): PublicStoreDefinition<
	Id,
	StoreState<State>,
	{ readonly [K in keyof Getters]: ReturnType<Getters[K]> },
	StoreActions<Actions>
>;
export function defineStore<Id extends string, Store extends AnyRecord>(
	id: Id,
	setup: SetupStoreFactory<Store>
): PublicStoreDefinition<
	Id,
	StoreState<Store>,
	StoreGetters<Record<never, never>>,
	StoreActions<{ [K in keyof Store as Store[K] extends AnyFunction ? K : never]: Store[K] extends AnyFunction ? Store[K] : never }>
>;
export function defineStore(id: string, definition: unknown) {
	assertValidStoreId(id);
	assertValidStoreDefinition(id, definition);

	const storeDefinition: StoreDefinition = {
		$id: id,
		options: isOptionStoreDefinition(definition) ? definition : undefined
	};

	registerDefinition(storeDefinition);

	const useStore = (manager: StateManager = getDefaultStateManager()) =>
		manager.createStore(storeDefinition, () => {
			if (isOptionStoreDefinition(definition)) {
				return createOptionStore(id, definition);
			}

			return createSetupStore(id, definition);
		});

	return Object.defineProperty(useStore, '$id', {
		value: id,
		enumerable: true,
		configurable: false,
		writable: false
	});
}
