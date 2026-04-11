type AnyRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type StoreFromSetup<Store extends AnyRecord, Id extends string> = Store & { readonly $id: Id };

type SetupStoreFactory<Store extends AnyRecord> = () => Store;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null;
}

function addStoreId<Store extends AnyRecord, Id extends string>(
  store: Store,
  id: Id,
): Store & { readonly $id: Id } {
  Object.defineProperty(store, "$id", {
    value: id,
    enumerable: true,
    configurable: false,
    writable: false,
  });

  return store as Store & { readonly $id: Id };
}

export function createSetupStore<Store extends AnyRecord, Id extends string>(
  id: Id,
  setup: SetupStoreFactory<Store>,
): StoreFromSetup<Store, Id> {
  const store = setup();

  if (!isRecord(store)) {
    throw new Error(
      `Invalid setup store definition for "${id}". Setup stores must return an object.`,
    );
  }

  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(store))) {
    if ("value" in descriptor && typeof descriptor.value === "function") {
      Reflect.set(store, key, descriptor.value.bind(store));
    }
  }

  return addStoreId(store, id);
}
