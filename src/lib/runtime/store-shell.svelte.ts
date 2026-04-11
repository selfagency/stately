import type { StoreMutationContext, StoreState } from '../pinia-like/store-types.js';
import { createMutationQueue } from './mutation-queue.svelte.js';
import { createSubscriptions } from './subscriptions.js';

type AnyRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

export interface StoreShell<Id extends string, State extends StoreState, Store extends object> {
	readonly $id: Id;
	$state: State;
	$patch(partial: Partial<State> | ((state: State) => void)): void;
	$reset(): void;
	$subscribe(callback: StoreSubscriptionCallback<Id, State, Store>): () => void;
	$onAction(callback: StoreActionSubscriber<Store>): () => void;
	$dispose(): void;
}

export interface StoreShellBuilder<
	Id extends string,
	State extends StoreState,
	Store extends object
> {
	store: Store & StoreShell<Id, State, Store & StoreShell<Id, State, Store>>;
	defineStateProperty<Key extends keyof State>(key: Key): void;
	defineGetter<Key extends PropertyKey>(key: Key, getter: () => unknown): void;
	defineAction<Key extends PropertyKey>(key: Key, action: AnyFunction): void;
	setStateValue<Key extends keyof State>(key: Key, value: State[Key]): void;
	notifyMutation(type: StoreMutationContext<Id, Store>['type'], payload?: unknown): void;
}

function cloneState<State extends StoreState>(state: State): State {
	return structuredClone(state);
}

function syncState<State extends StoreState>(target: State, next: Partial<State>): void {
	for (const key of Object.keys(target)) {
		if (!(key in next)) {
			Reflect.deleteProperty(target, key);
		}
	}

	for (const [key, value] of Object.entries(next)) {
		Reflect.set(target, key, value);
	}
}

export function createStoreShell<
	Id extends string,
	State extends StoreState,
	Store extends object
>(config: {
	id: Id;
	store: Store;
	state: State;
	onDispose?: () => void;
}): StoreShellBuilder<Id, State, Store> {
	let suppressDirectMutation = false;
	let disposed = false;
	const initialState = cloneState(config.state);
	const shellStore = config.store as Store &
		StoreShell<Id, State, Store & StoreShell<Id, State, Store>>;
	const subscriptions = createSubscriptions({
		storeId: config.id,
		state: () => shellStore.$state,
		store: () => shellStore
	});

	const notifyMutation = (
		type: StoreMutationContext<Id, Store>['type'],
		payload?: unknown
	): void => {
		if (disposed) {
			return;
		}

		subscriptions.notifyMutation(type, payload);
	};

	const mutationQueue = createMutationQueue({
		storeId: config.id,
		notify: notifyMutation
	});

	const setStateValue = <Key extends keyof State>(key: Key, value: State[Key]): void => {
		Reflect.set(config.state, key, value);
		if (!suppressDirectMutation) {
			mutationQueue.recordChange({ key, value });
		}
	};

	const defineStateProperty = <Key extends keyof State>(key: Key): void => {
		Object.defineProperty(shellStore, key, {
			enumerable: true,
			configurable: false,
			get(): State[Key] {
				return Reflect.get(config.state, key) as State[Key];
			},
			set(value: State[Key]) {
				setStateValue(key, value);
			}
		});
	};

	const defineGetter = (key: PropertyKey, getter: () => unknown): void => {
		Object.defineProperty(shellStore, key, {
			enumerable: true,
			configurable: false,
			get: getter
		});
	};

	const defineAction = (key: PropertyKey, action: AnyFunction): void => {
		Object.defineProperty(shellStore, key, {
			enumerable: true,
			configurable: false,
			value: subscriptions.wrapAction(String(key), action.bind(shellStore))
		});
	};

	Object.defineProperties(shellStore, {
		$id: {
			value: config.id,
			enumerable: true,
			configurable: false,
			writable: false
		},
		$state: {
			enumerable: true,
			configurable: false,
			get(): State {
				return config.state;
			},
			set(nextState: State) {
				mutationQueue.run('patch-object', nextState, () => {
					suppressDirectMutation = true;
					syncState(config.state, nextState);
					suppressDirectMutation = false;
				});
			}
		},
		$patch: {
			enumerable: false,
			configurable: false,
			value(patch: Partial<State> | ((state: State) => void)) {
				if (typeof patch === 'function') {
					mutationQueue.run('patch-function', undefined, () => {
						patch(config.state);
					});
					return;
				}

				mutationQueue.run('patch-object', patch, () => {
					suppressDirectMutation = true;
					for (const [key, value] of Object.entries(patch)) {
						Reflect.set(config.state, key, value);
					}
					suppressDirectMutation = false;
				});
			}
		},
		$reset: {
			enumerable: false,
			configurable: false,
			value() {
				mutationQueue.run('patch-object', initialState, () => {
					suppressDirectMutation = true;
					syncState(config.state, cloneState(initialState));
					suppressDirectMutation = false;
				});
			}
		},
		$subscribe: {
			enumerable: false,
			configurable: false,
			value(
				callback: Parameters<typeof subscriptions.subscribe>[0],
				options?: Parameters<typeof subscriptions.subscribe>[1]
			) {
				return subscriptions.subscribe(callback, options);
			}
		},
		$onAction: {
			enumerable: false,
			configurable: false,
			value(callback: Parameters<typeof subscriptions.onAction>[0]) {
				return subscriptions.onAction(callback);
			}
		},
		$dispose: {
			enumerable: false,
			configurable: false,
			value() {
				if (disposed) {
					return;
				}
				disposed = true;
				subscriptions.clear();
				config.onDispose?.();
			}
		}
	});

	return {
		store: shellStore,
		defineStateProperty,
		defineGetter,
		defineAction,
		setStateValue,
		notifyMutation
	};
}
