import { SvelteSet } from 'svelte/reactivity';
import type { StoreActionHookContext, StoreMutationContext, StoreState } from '../pinia-like/store-types.js';

type AnyRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type StoreSubscriptionCallback<Id extends string, State extends StoreState, Store extends object> = (
	mutation: StoreMutationContext<Id, Store>,
	state: State
) => void;

type StoreActionSubscriber<Store extends object> = (
	context: StoreActionHookContext<Store, string, unknown[], unknown>
) => void;

export interface StoreShell<Id extends string, State extends StoreState, Store extends object> {
	readonly $id: Id;
	$id: Id;
	$state: State;
	$patch(partial: Partial<State> | ((state: State) => void)): void;
	$reset(): void;
	$subscribe(callback: StoreSubscriptionCallback<Id, State, Store>): () => void;
	$onAction(callback: StoreActionSubscriber<Store>): () => void;
	$dispose(): void;
}

export interface StoreShellBuilder<Id extends string, State extends StoreState, Store extends object> {
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

export function createStoreShell<Id extends string, State extends StoreState, Store extends object>(config: {
	id: Id;
	store: Store;
	state: State;
	onDispose?: () => void;
}): StoreShellBuilder<Id, State, Store> {
	const mutationSubscribers = new SvelteSet<StoreSubscriptionCallback<Id, State, Store>>();
	const actionSubscribers = new SvelteSet<StoreActionSubscriber<Store>>();
	let suppressMutation = false;
	let disposed = false;
	const initialState = cloneState(config.state);
	const shellStore = config.store as Store & StoreShell<Id, State, Store & StoreShell<Id, State, Store>>;

	const notifyMutation = (type: StoreMutationContext<Id, Store>['type'], payload?: unknown): void => {
		if (disposed) {
			return;
		}

		const mutation = {
			storeId: config.id,
			store: shellStore,
			type,
			payload
		} satisfies StoreMutationContext<Id, Store & StoreShell<Id, State, Store>>;

		for (const callback of mutationSubscribers) {
			callback(mutation, shellStore.$state);
		}
	};

	const withSuppressedMutation = (type: StoreMutationContext<Id, Store>['type'], payload: unknown, operation: () => void): void => {
		const previous = suppressMutation;
		suppressMutation = true;
		operation();
		suppressMutation = previous;
		notifyMutation(type, payload);
	};

	const setStateValue = <Key extends keyof State>(key: Key, value: State[Key]): void => {
		Reflect.set(config.state, key, value);
		if (!suppressMutation) {
			notifyMutation('direct', { key, value });
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
		const wrapped = (...args: unknown[]) => {
			const afterCallbacks: Array<(result: unknown) => void> = [];
			const errorCallbacks: Array<(error: unknown) => void> = [];
			const context: StoreActionHookContext<Store & StoreShell<Id, State, Store>, string, unknown[], unknown> = {
				name: String(key),
				store: shellStore,
				args,
				after(callback) {
					afterCallbacks.push(callback);
				},
				onError(callback) {
					errorCallbacks.push(callback);
				}
			};

			for (const callback of actionSubscribers) {
				callback(context as StoreActionHookContext<Store, string, unknown[], unknown>);
			}

			try {
				const result = action.apply(shellStore, args);
				if (result instanceof Promise) {
					return result
						.then((resolved) => {
							for (const callback of afterCallbacks) {
								callback(resolved);
							}
							return resolved;
						})
						.catch((error) => {
							for (const callback of errorCallbacks) {
								callback(error);
							}
							throw error;
						});
				}

				for (const callback of afterCallbacks) {
					callback(result);
				}

				return result;
			} catch (error) {
				for (const callback of errorCallbacks) {
					callback(error);
				}
				throw error;
			}
		};

		Object.defineProperty(shellStore, key, {
			enumerable: true,
			configurable: false,
			value: wrapped
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
				withSuppressedMutation('patch-object', nextState, () => {
					syncState(config.state, nextState);
				});
			}
		},
		$patch: {
			enumerable: false,
			configurable: false,
			value(patch: Partial<State> | ((state: State) => void)) {
				if (typeof patch === 'function') {
					withSuppressedMutation('patch-function', undefined, () => {
						patch(config.state);
					});
					return;
				}

				withSuppressedMutation('patch-object', patch, () => {
					for (const [key, value] of Object.entries(patch)) {
						Reflect.set(config.state, key, value);
					}
				});
			}
		},
		$reset: {
			enumerable: false,
			configurable: false,
			value() {
				withSuppressedMutation('patch-object', initialState, () => {
					syncState(config.state, cloneState(initialState));
				});
			}
		},
		$subscribe: {
			enumerable: false,
			configurable: false,
			value(callback: StoreSubscriptionCallback<Id, State, Store>) {
				mutationSubscribers.add(callback);
				return () => {
					mutationSubscribers.delete(callback);
				};
			}
		},
		$onAction: {
			enumerable: false,
			configurable: false,
			value(callback: StoreActionSubscriber<Store>) {
				actionSubscribers.add(callback);
				return () => {
					actionSubscribers.delete(callback);
				};
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
				mutationSubscribers.clear();
				actionSubscribers.clear();
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
