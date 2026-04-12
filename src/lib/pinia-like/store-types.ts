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

export interface StoreSubscribeOptions<State extends StoreState = StoreState> {
	detached?: boolean;
	select?: (state: State) => unknown;
	equalityFn?: (previous: unknown, next: unknown) => boolean;
}

export interface StoreShellMethods<Id extends string, State extends StoreState, Store extends object> {
	readonly $id: Id;
	$state: State;
	$patch(partial: Partial<State> | ((state: State) => void)): void;
	$reset(): void;
	$subscribe(
		callback: (mutation: StoreMutationContext<Id, Store>, state: State) => void,
		options?: StoreSubscribeOptions<State>
	): () => void;
	$onAction(callback: (context: StoreActionHookContext<Store, string, unknown[], unknown>) => void): () => void;
	$dispose(): void;
	subscribe(run: (value: State) => void, invalidate?: (value?: State) => void): () => void;
	set(value: State): void;
}

export type StoreInstance<
	Id extends string,
	State extends StoreState = StoreState,
	Getters extends StoreGetters = StoreGetters,
	Actions extends StoreActions = StoreActions
> = State &
	Readonly<Getters> &
	Actions &
	StoreCustomProperties &
	StoreShellMethods<Id, State, StoreInstance<Id, State, Getters, Actions>>;

export interface StoreDefinition<
	Id extends string = string,
	State extends StoreState = StoreState,
	Getters extends StoreGetters = StoreGetters,
	Actions extends StoreActions = StoreActions
> {
	readonly $id: Id;
	(manager?: StateManager): StoreInstance<Id, State, Getters, Actions>;
}

export interface StoreMutationContext<Id extends string = string, Store extends object = StoreInstance<Id>> {
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
	before(callback: () => boolean | void): void;
	after(callback: (result: Result) => void): void;
	onError(callback: (error: unknown) => void): void;
}
