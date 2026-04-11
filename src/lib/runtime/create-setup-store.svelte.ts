import { createStoreShell } from './store-shell.svelte.js';

type AnyRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type StoreFromSetup<Store extends AnyRecord, Id extends string> = Store & { readonly $id: Id };

type SetupStoreFactory<Store extends AnyRecord> = () => Store;

function isRecord(value: unknown): value is AnyRecord {
	return typeof value === 'object' && value !== null;
}

export function createSetupStore<Store extends AnyRecord, Id extends string>(
	id: Id,
	setup: SetupStoreFactory<Store>
): StoreFromSetup<Store, Id> {
	const result = setup();

	if (!isRecord(result)) {
		throw new Error(
			`Invalid setup store definition for "${id}". Setup stores must return an object.`
		);
	}

	const state = $state({} as Record<string, unknown>);
	const store = {} as Store;
	const shell = createStoreShell({ id, store, state });

	for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(result))) {
		if ('value' in descriptor && typeof descriptor.value === 'function') {
			shell.defineAction(key, descriptor.value as AnyFunction);
			continue;
		}

		if (descriptor.get && !descriptor.set) {
			shell.defineGetter(key, () => descriptor.get?.call(shell.store));
			continue;
		}

		Reflect.set(state, key, descriptor.value);
		shell.defineStateProperty(key);
	}

	return shell.store;
}
