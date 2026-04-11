import { SvelteMap } from 'svelte/reactivity';
import type {
	DefineStoreOptionsBase,
	StoreDefinition as PublicStoreDefinition,
	StoreActions,
	StoreGetters,
	StoreInstance,
	StoreState
} from './pinia-like/store-types.js';
import { getDefaultStateManager } from './root/create-state-manager.js';
import type { StateManager, StoreDefinition } from './root/types.js';
import { createOptionStore } from './runtime/create-option-store.svelte.js';
import { createSetupStore } from './runtime/create-setup-store.svelte.js';

type AnyRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type GetterTree<State extends AnyRecord> = StoreGetters<Record<string, (state: State) => unknown>>;
type ActionTree = StoreActions<Record<string, AnyFunction>>;

export interface DefineSetupStoreOptions<Store extends AnyRecord> extends DefineStoreOptionsBase<
	StoreState<Store>,
	StoreInstance<string, StoreState<Store>>
> {
	setup: () => Store;
}

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
	return isRecord(value) && isFunction(Reflect.get(value, 'state'));
}

function isSetupStoreOptions(value: unknown): value is DefineSetupStoreOptions<AnyRecord> {
	return isRecord(value) && isFunction(Reflect.get(value, 'setup'));
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
	| SetupStoreFactory<AnyRecord>
	| DefineSetupStoreOptions<AnyRecord> {
	if (
		!isOptionStoreDefinition(definition) &&
		!isFunction(definition) &&
		!isSetupStoreOptions(definition)
	) {
		throw new Error(
			`Invalid store definition for "${id}". Expected an options object, a setup function, or a setup options object.`
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
	StoreActions<{
		[K in keyof Store as Store[K] extends AnyFunction ? K : never]: Store[K] extends AnyFunction
			? Store[K]
			: never;
	}>
>;
export function defineStore<Id extends string, Store extends AnyRecord>(
	id: Id,
	setup: DefineSetupStoreOptions<Store>
): PublicStoreDefinition<
	Id,
	StoreState<Store>,
	StoreGetters<Record<never, never>>,
	StoreActions<{
		[K in keyof Store as Store[K] extends AnyFunction ? K : never]: Store[K] extends AnyFunction
			? Store[K]
			: never;
	}>
>;
export function defineStore(id: string, definition: unknown) {
	assertValidStoreId(id);
	assertValidStoreDefinition(id, definition);

	const storeDefinition: StoreDefinition = {
		$id: id,
		options:
			isOptionStoreDefinition(definition) || isSetupStoreOptions(definition)
				? definition
				: undefined
	};

	registerDefinition(storeDefinition);

	const useStore = (manager: StateManager = getDefaultStateManager()) =>
		manager.createStore(storeDefinition, () => {
			if (isOptionStoreDefinition(definition)) {
				return createOptionStore(id, definition);
			}

			return createSetupStore(id, isSetupStoreOptions(definition) ? definition.setup : definition);
		});

	return Object.defineProperty(useStore, '$id', {
		value: id,
		enumerable: true,
		configurable: false,
		writable: false
	});
}
