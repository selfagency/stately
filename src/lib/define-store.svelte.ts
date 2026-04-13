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

type AnyObject = object;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type NonPlainObjectState =
	| readonly unknown[]
	| AnyFunction
	| Date
	| RegExp
	| Map<unknown, unknown>
	| Set<unknown>
	| WeakMap<object, unknown>
	| WeakSet<object>
	| Promise<unknown>;

// Compile-time approximation of option-store runtime requirements.
// This excludes the most common non-plain shapes up front, while createStoreShell()
// still performs the definitive runtime plain-object prototype check.
// Note: TypeScript's structural typing cannot fully exclude class instances with
// custom prototypes — those will pass this check but throw at runtime.
type OptionStoreStateShape<State extends AnyObject> = State extends NonPlainObjectState ? never : State;

type GetterTree<State extends AnyObject> = StoreGetters<Record<string, (state: State) => unknown>>;
type ActionTree = StoreActions<Record<string, AnyFunction>>;

export interface DefineSetupStoreOptions<Store extends AnyObject> extends DefineStoreOptionsBase<
	StoreState<Store>,
	StoreInstance<string, StoreState<Store>>
> {
	setup: () => Store;
}

export interface DefineStoreOptions<
	State extends AnyObject,
	Getters extends GetterTree<OptionStoreStateShape<State>>,
	Actions extends ActionTree
> extends DefineStoreOptionsBase<
	StoreState<OptionStoreStateShape<State>>,
	StoreInstance<
		string,
		StoreState<OptionStoreStateShape<State>>,
		{ readonly [K in keyof Getters]: ReturnType<Getters[K]> },
		StoreActions<Actions>
	>
> {
	state: () => OptionStoreStateShape<State>;
	getters?: Getters &
		ThisType<OptionStoreStateShape<State> & { readonly [K in keyof Getters]: ReturnType<Getters[K]> } & Actions>;
	actions?: Actions &
		ThisType<OptionStoreStateShape<State> & { readonly [K in keyof Getters]: ReturnType<Getters[K]> } & Actions>;
}

type SetupStoreFactory<Store extends AnyObject> = () => Store;

function isObject(value: unknown): value is AnyObject {
	return typeof value === 'object' && value !== null;
}

function isFunction(value: unknown): value is AnyFunction {
	return typeof value === 'function';
}

function isOptionStoreDefinition(
	value: unknown
): value is DefineStoreOptions<AnyObject, GetterTree<AnyObject>, ActionTree> {
	return isObject(value) && isFunction(Reflect.get(value, 'state'));
}

function isSetupStoreOptions(value: unknown): value is DefineSetupStoreOptions<AnyObject> {
	return isObject(value) && isFunction(Reflect.get(value, 'setup'));
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
	| DefineStoreOptions<AnyObject, GetterTree<AnyObject>, ActionTree>
	| SetupStoreFactory<AnyObject>
	| DefineSetupStoreOptions<AnyObject> {
	if (!isOptionStoreDefinition(definition) && !isFunction(definition) && !isSetupStoreOptions(definition)) {
		throw new Error(
			`Invalid store definition for "${id}". Expected an options object, a setup function, or a setup options object.`
		);
	}
}

export function defineStore<
	Id extends string,
	State extends AnyObject,
	Getters extends GetterTree<OptionStoreStateShape<State>> = GetterTree<OptionStoreStateShape<State>>,
	Actions extends ActionTree = ActionTree
>(
	id: Id,
	options: DefineStoreOptions<State, Getters, Actions>
): PublicStoreDefinition<
	Id,
	StoreState<OptionStoreStateShape<State>>,
	{ readonly [K in keyof Getters]: ReturnType<Getters[K]> },
	StoreActions<Actions>
>;
export function defineStore<Id extends string, Store extends AnyObject>(
	id: Id,
	setup: SetupStoreFactory<Store>
): PublicStoreDefinition<
	Id,
	StoreState<Store>,
	StoreGetters<Record<never, never>>,
	StoreActions<{
		[K in keyof Store as Store[K] extends AnyFunction ? K : never]: Store[K] extends AnyFunction ? Store[K] : never;
	}>
>;
export function defineStore<Id extends string, Store extends AnyObject>(
	id: Id,
	setup: DefineSetupStoreOptions<Store>
): PublicStoreDefinition<
	Id,
	StoreState<Store>,
	StoreGetters<Record<never, never>>,
	StoreActions<{
		[K in keyof Store as Store[K] extends AnyFunction ? K : never]: Store[K] extends AnyFunction ? Store[K] : never;
	}>
>;
export function defineStore(id: string, definition: unknown) {
	assertValidStoreId(id);
	assertValidStoreDefinition(id, definition);

	const storeDefinition: StoreDefinition = {
		$id: id,
		options: isOptionStoreDefinition(definition) || isSetupStoreOptions(definition) ? definition : undefined
	};

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
