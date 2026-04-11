import type { StoreActionHookContext, StoreMutationContext, StoreState } from '../pinia-like/store-types.js';
import { createDevtoolsTimelineRecorder } from './devtools-timeline.svelte.js';
import { createMutationQueue } from './mutation-queue.svelte.js';
import { createSubscriptions } from './subscriptions.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

export interface StoreShell<Id extends string, State extends StoreState, Store extends object> {
	readonly $id: Id;
	$state: State;
	$patch(partial: Partial<State> | ((state: State) => void)): void;
	$reset(): void;
	$subscribe(callback: (mutation: StoreMutationContext<Id, Store>, state: State) => void): () => void;
	$onAction(callback: (context: StoreActionHookContext<Store, string, unknown[], unknown>) => void): () => void;
	$dispose(): void;
	subscribe(run: (value: State) => void, invalidate?: (value?: State) => void): () => void;
	set(value: State): void;
}

export interface StoreShellBuilder<Id extends string, State extends StoreState, Store extends object> {
	store: Store & StoreShell<Id, State, Store & StoreShell<Id, State, Store>>;
	timeline: ReturnType<typeof createDevtoolsTimelineRecorder>;
	defineStateProperty<Key extends keyof State>(key: Key): void;
	defineGetter<Key extends PropertyKey>(key: Key, getter: () => unknown): void;
	defineAction<Key extends PropertyKey>(key: Key, action: AnyFunction): void;
	setStateValue<Key extends keyof State>(key: Key, value: State[Key]): void;
	notifyMutation(type: StoreMutationContext<Id, Store>['type'], payload?: unknown): void;
}

function cloneState<State extends StoreState>(state: State): State {
	return $state.snapshot(state) as State;
}

function isStateEqual(left: unknown, right: unknown, visited = new WeakSet<object>()): boolean {
	if (Object.is(left, right)) {
		return true;
	}

	if (typeof left !== typeof right) {
		return false;
	}

	if (Array.isArray(left) && Array.isArray(right)) {
		if (left.length !== right.length) {
			return false;
		}

		if (visited.has(left)) {
			return true;
		}
		visited.add(left);

		for (let index = 0; index < left.length; index += 1) {
			if (!isStateEqual(Reflect.get(left, index), Reflect.get(right, index), visited)) {
				return false;
			}
		}

		return true;
	}

	if (typeof left === 'object' && left !== null && typeof right === 'object' && right !== null) {
		if (visited.has(left)) {
			return true;
		}
		visited.add(left);

		const leftKeys = Object.keys(left);
		const rightKeys = Object.keys(right);
		if (leftKeys.length !== rightKeys.length) {
			return false;
		}

		for (const key of leftKeys) {
			if (!Reflect.has(right, key)) {
				return false;
			}
			if (!isStateEqual(Reflect.get(left, key), Reflect.get(right, key), visited)) {
				return false;
			}
		}

		return true;
	}

	return false;
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
	let suppressDirectMutation = false;
	let disposed = false;
	let mutationCount = 0;
	const initialState = cloneState(config.state);
	const shellStore = config.store as Store & StoreShell<Id, State, Store & StoreShell<Id, State, Store>>;
	const timeline = createDevtoolsTimelineRecorder({
		storeId: config.id,
		readSnapshot: () => cloneState(config.state)
	});
	const subscriptions = createSubscriptions({
		storeId: config.id,
		state: () => shellStore.$state,
		store: () => shellStore
	});
	let unregisterInspectorStore: (() => void) | undefined;

	subscriptions.onAction(({ name, args, after, onError }) => {
		const action = timeline.startAction({
			label: `${config.id}:${name}`,
			payload: { args }
		});

		after((result) => {
			action.finish(result);
		});

		onError((error) => {
			action.fail(error);
		});
	});

	const notifyMutation = (type: StoreMutationContext<Id, Store>['type'], payload?: unknown): void => {
		if (disposed) {
			return;
		}

		mutationCount += 1;

		subscriptions.notifyMutation(type, payload);
	};

	const mutationQueue = createMutationQueue({
		storeId: config.id,
		notify(type, payload) {
			notifyMutation(type, payload);
			if (!disposed) {
				timeline.recordMutation({
					label: `${config.id}:${type}`,
					payload
				});
			}
		}
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
		const actionWithMutationInference = function (this: unknown, ...args: unknown[]) {
			const mutationCountBeforeAction = mutationCount;
			const beforeState = cloneState(config.state);

			const flushInferredDirectMutation = () => {
				if (disposed || mutationCount !== mutationCountBeforeAction) {
					return;
				}

				const afterState = cloneState(config.state);
				if (!isStateEqual(beforeState, afterState)) {
					mutationQueue.recordChange({ action: String(key), inferred: true });
				}
			};

			try {
				const result = action.apply(shellStore, args);
				if (typeof (result as { then?: unknown })?.then === 'function') {
					// Emit synchronous mutations immediately, before the first await.
					queueMicrotask(flushInferredDirectMutation);
					void (result as Promise<unknown>).then(
						() => {
							flushInferredDirectMutation();
						},
						() => {
							flushInferredDirectMutation();
						}
					);
				} else {
					flushInferredDirectMutation();
				}

				return result;
			} catch (error) {
				flushInferredDirectMutation();
				throw error;
			}
		};

		Object.defineProperty(shellStore, key, {
			enumerable: true,
			configurable: true,
			writable: true,
			value: subscriptions.wrapAction(String(key), actionWithMutationInference as AnyFunction)
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
			configurable: true,
			value() {
				if (disposed) {
					return;
				}
				disposed = true;
				unregisterInspectorStore?.();
				subscriptions.clear();
				config.onDispose?.();
			}
		},
		subscribe: {
			enumerable: false,
			configurable: false,
			value(run: (value: State) => void, invalidate?: (value?: State) => void): () => void {
				run(cloneState(config.state));

				return subscriptions.subscribe(() => {
					invalidate?.();
					run(cloneState(config.state));
				});
			}
		},
		set: {
			enumerable: false,
			configurable: false,
			value(value: State) {
				mutationQueue.run('patch-object', value, () => {
					suppressDirectMutation = true;
					syncState(config.state, value);
					suppressDirectMutation = false;
				});
			}
		}
	});

	const statelyInspectorHookKey = Symbol.for('stately.inspector.hook');
	const globalHook = Reflect.get(globalThis, statelyInspectorHookKey) as
		| { register?: (store: object, timeline: object) => () => void }
		| undefined;
	if (globalHook?.register) {
		unregisterInspectorStore = globalHook.register(shellStore, timeline);
	}

	return {
		store: shellStore,
		timeline,
		defineStateProperty,
		defineGetter,
		defineAction,
		setStateValue,
		notifyMutation
	};
}
