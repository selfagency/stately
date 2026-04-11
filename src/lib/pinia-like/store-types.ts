import type { StateManager } from '../root/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type RecordWithFunctions = Record<string, AnyFunction>;

type ObjectLike = object;

export type StoreState<TState extends ObjectLike = object> = TState;

export type StoreGetters<TGetters extends ObjectLike = object> = TGetters;

export type StoreActions<TActions extends RecordWithFunctions = RecordWithFunctions> = TActions;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StoreCustomProperties {
	// plugins can augment store instances by extending this interface
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StoreCustomStateProperties {
	// plugins can augment store state by extending this interface
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
export interface DefineStoreOptionsBase<State extends StoreState = StoreState, Store = unknown> {
	// plugins can augment definition options by extending this interface
}

export type StoreInstance<
	Id extends string,
	State extends StoreState = StoreState,
	Getters extends StoreGetters = StoreGetters,
	Actions extends StoreActions = StoreActions
> = State & Readonly<Getters> & Actions & StoreCustomProperties & { readonly $id: Id };

export interface StoreDefinition<
	Id extends string = string,
	State extends StoreState = StoreState,
	Getters extends StoreGetters = StoreGetters,
	Actions extends StoreActions = StoreActions
> {
	readonly $id: Id;
	(manager?: StateManager): StoreInstance<Id, State, Getters, Actions>;
}

export interface StoreMutationContext<
	Id extends string = string,
	Store extends object = StoreInstance<Id>
> {
	readonly storeId: Id;
	readonly store: Store;
	readonly type: 'direct' | 'patch-object' | 'patch-function';
	readonly payload?: unknown;
}

export interface StoreActionHookContext<
	Store extends object = StoreInstance<string>,
	Name extends string = string,
	Args extends unknown[] = unknown[],
	Result = unknown
> {
	readonly name: Name;
	readonly store: Store;
	readonly args: Args;
	after(callback: (result: Result) => void): void;
	onError(callback: (error: unknown) => void): void;
}
