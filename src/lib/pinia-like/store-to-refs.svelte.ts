type AnyRecord = object;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

export interface StoreRef<TValue> {
	value: TValue;
}

export type StoreRefs<Store extends AnyRecord> = {
	[K in keyof Store as Store[K] extends AnyFunction ? never : K extends `$${string}` ? never : K]: StoreRef<Store[K]>;
};

export function storeToRefs<Store extends AnyRecord>(store: Store): StoreRefs<Store> {
	const refs = {} as StoreRefs<Store>;
	const source = store as Record<string, unknown>;

	for (const key of Object.keys(store) as Array<keyof Store>) {
		if (String(key).startsWith('$')) {
			continue;
		}

		const value = Reflect.get(source, key);
		if (typeof value === 'function') {
			continue;
		}

		const descriptor = Object.getOwnPropertyDescriptor(store, key);
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
