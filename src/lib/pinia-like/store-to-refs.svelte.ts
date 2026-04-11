import { SvelteSet } from 'svelte/reactivity';

type AnyRecord = object;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

export interface StoreRef<TValue> {
	value: TValue;
}

export type StoreRefs<Store extends AnyRecord> = {
	[K in keyof Store as Store[K] extends AnyFunction ? never : K extends `$${string}` ? never : K]: StoreRef<Store[K]>;
};

function collectKeys(value: object): string[] {
	const keys = new SvelteSet<string>();
	let current: object | null = value;

	while (current && current !== Object.prototype) {
		for (const key of Object.keys(Object.getOwnPropertyDescriptors(current))) {
			if (key === 'constructor') {
				continue;
			}
			keys.add(key);
		}
		current = Object.getPrototypeOf(current);
	}

	return Array.from(keys);
}

function resolveDescriptor(value: object, key: string): PropertyDescriptor | undefined {
	let current: object | null = value;

	while (current && current !== Object.prototype) {
		const descriptor = Object.getOwnPropertyDescriptor(current, key);
		if (descriptor) {
			return descriptor;
		}
		current = Object.getPrototypeOf(current);
	}

	return undefined;
}

export function storeToRefs<Store extends AnyRecord>(store: Store): StoreRefs<Store> {
	const refs = {} as StoreRefs<Store>;
	const source = store as Record<string, unknown>;

	for (const rawKey of collectKeys(store)) {
		const key = rawKey as keyof Store;
		if (rawKey.startsWith('$')) {
			continue;
		}

		const value = Reflect.get(source, key);
		if (typeof value === 'function') {
			continue;
		}

		const descriptor = resolveDescriptor(store, rawKey);
		const ref: Partial<StoreRef<Store[typeof key]>> = {
			get value() {
				return Reflect.get(source, key) as Store[typeof key];
			}
		};

		if (descriptor?.set || descriptor?.writable) {
			Object.defineProperty(ref, 'value', {
				enumerable: true,
				configurable: false,
				get() {
					return Reflect.get(source, key) as Store[typeof key];
				},
				set(nextValue: Store[typeof key]) {
					Reflect.set(source, key, nextValue);
				}
			});
		}

		Object.defineProperty(refs, key, {
			enumerable: true,
			configurable: false,
			value: ref
		});
	}

	return refs;
}
