import { onDestroy } from 'svelte';
import type {
	StoreActionHookContext,
	StoreMutationContext,
	StoreState,
	StoreSubscribeOptions
} from '../pinia-like/store-types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type MutationSubscriber<Id extends string, State extends StoreState, Store extends object> = (
	mutation: StoreMutationContext<Id, Store>,
	state: State
) => void;

type ActionSubscriber<Store extends object> = (
	context: StoreActionHookContext<Store, string, unknown[], unknown>
) => void;

export function createSubscriptions<Id extends string, State extends StoreState, Store extends object>(config: {
	storeId: Id;
	state: () => State;
	store: () => Store;
}) {
	const mutationSubscribers = new Set<MutationSubscriber<Id, State, Store>>();
	const actionSubscribers = new Set<ActionSubscriber<Store>>();

	return {
		subscribe(callback: MutationSubscriber<Id, State, Store>, options?: StoreSubscribeOptions) {
			mutationSubscribers.add(callback);
			const unsubscribe = () => {
				mutationSubscribers.delete(callback);
			};
			if (!options?.detached) {
				try {
					onDestroy(unsubscribe);
				} catch {
					// Not in a component lifecycle context; caller is responsible for cleanup.
				}
			}
			return unsubscribe;
		},
		onAction(callback: ActionSubscriber<Store>) {
			actionSubscribers.add(callback);
			return () => {
				actionSubscribers.delete(callback);
			};
		},
		notifyMutation(type: StoreMutationContext<Id, Store>['type'], payload?: unknown) {
			const mutation = {
				storeId: config.storeId,
				store: config.store(),
				type,
				payload
			} satisfies StoreMutationContext<Id, Store>;

			for (const callback of mutationSubscribers) {
				callback(mutation, config.state());
			}
		},
		wrapAction<Name extends string, Action extends AnyFunction>(name: Name, action: Action): Action {
			const wrapped = function (this: unknown, ...args: Parameters<Action>): ReturnType<Action> {
				const afterCallbacks: Array<(result: unknown) => void> = [];
				const errorCallbacks: Array<(error: unknown) => void> = [];
				const context: StoreActionHookContext<Store, Name, Parameters<Action>, Awaited<ReturnType<Action>>> = {
					name,
					store: config.store(),
					args,
					after(callback) {
						afterCallbacks.push(callback as (result: unknown) => void);
					},
					onError(callback) {
						errorCallbacks.push(callback);
					}
				};

				for (const callback of actionSubscribers) {
					callback(context as StoreActionHookContext<Store, string, unknown[], unknown>);
				}

				try {
					const result = action.apply(this, args) as ReturnType<Action>;
					if (typeof (result as { then?: unknown })?.then === 'function') {
						return (result as Promise<unknown>)
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
							}) as ReturnType<Action>;
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

			return wrapped as Action;
		},
		clear() {
			mutationSubscribers.clear();
			actionSubscribers.clear();
		}
	};
}
