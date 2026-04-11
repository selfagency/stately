import type { DefineStoreOptions } from '../define-store.svelte.js';

type AnyRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type GetterTree<State extends AnyRecord> = Record<string, (state: State) => unknown>;
type ActionTree = Record<string, AnyFunction>;

type StoreFromOptions<
	State extends AnyRecord,
	Getters extends GetterTree<State>,
	Actions extends ActionTree,
	Id extends string
> = State & { readonly [K in keyof Getters]: ReturnType<Getters[K]> } & Actions & {
		readonly $id: Id;
	};

function addStoreId<Store extends AnyRecord, Id extends string>(
	store: Store,
	id: Id
): Store & { readonly $id: Id } {
	Object.defineProperty(store, '$id', {
		value: id,
		enumerable: true,
		configurable: false,
		writable: false
	});

	return store as Store & { readonly $id: Id };
}

export function createOptionStore<
	State extends AnyRecord,
	Getters extends GetterTree<State>,
	Actions extends ActionTree,
	Id extends string
>(
	id: Id,
	options: DefineStoreOptions<State, Getters, Actions>
): StoreFromOptions<State, Getters, Actions, Id> {
	const state = $state(options.state());
	const store = {} as State & { readonly [K in keyof Getters]: ReturnType<Getters[K]> } & Actions;

	const defineStateProperty = <K extends keyof State>(key: K): void => {
		Object.defineProperty(store, key, {
			enumerable: true,
			configurable: false,
			get(): State[K] {
				return Reflect.get(state, key) as State[K];
			},
			set(value: State[K]) {
				Reflect.set(state, key, value);
			}
		});
	};

	for (const key of Object.keys(state) as Array<keyof State>) {
		defineStateProperty(key);
	}

	for (const [key, getter] of Object.entries(options.getters ?? {}) as Array<
		[keyof Getters, Getters[keyof Getters]]
	>) {
		Object.defineProperty(store, key, {
			enumerable: true,
			configurable: false,
			get() {
				return getter.call(store, state);
			}
		});
	}

	for (const [key, action] of Object.entries(options.actions ?? {}) as Array<
		[keyof Actions, Actions[keyof Actions]]
	>) {
		Object.defineProperty(store, key, {
			enumerable: true,
			configurable: false,
			value: action.bind(store)
		});
	}

	return addStoreId(store, id);
}
