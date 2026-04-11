import type { DefineStoreOptions } from '../define-store.svelte.js';
import { createStoreShell } from './store-shell.svelte.js';

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
	const shell = createStoreShell({ id, store, state });

	for (const key of Object.keys(state) as Array<keyof State>) {
		shell.defineStateProperty(key);
	}

	for (const [key, getter] of Object.entries(options.getters ?? {}) as Array<
		[keyof Getters, Getters[keyof Getters]]
	>) {
		shell.defineGetter(key, () => getter.call(shell.store, state));
	}

	for (const [key, action] of Object.entries(options.actions ?? {}) as Array<
		[keyof Actions, Actions[keyof Actions]]
	>) {
		shell.defineAction(key, action);
	}

	return shell.store;
}
