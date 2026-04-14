import { createStoreShell } from './store-shell.svelte.js';

type AnyObject = object;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type StoreFromSetup<Store extends AnyObject, Id extends string> = Store & { readonly $id: Id };

type SetupStoreFactory<Store extends AnyObject> = () => Store;

function isObject(value: unknown): value is AnyObject {
  return typeof value === 'object' && value !== null;
}

function collectDescriptors(value: object): Array<[string, PropertyDescriptor]> {
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- plain Map; not used in reactive context
  const descriptors = new Map<string, PropertyDescriptor>();
  let current: object | null = value;

  while (current && current !== Object.prototype) {
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(current))) {
      if (key === 'constructor' || descriptors.has(key)) {
        continue;
      }
      descriptors.set(key, descriptor);
    }
    current = Object.getPrototypeOf(current);
  }

  return Array.from(descriptors.entries());
}

export function createSetupStore<Store extends AnyObject, Id extends string>(
  id: Id,
  setup: SetupStoreFactory<Store>
): StoreFromSetup<Store, Id> {
  const result = setup();

  if (!isObject(result)) {
    throw new Error(`Invalid setup store definition for "${id}". Setup stores must return an object.`);
  }

  const state = $state({} as Record<string, unknown>);
  const store = {} as Store;
  const shell = createStoreShell({ id, store, state });
  const stateKey = (key: string) => key as keyof typeof state;

  for (const [key, descriptor] of collectDescriptors(result)) {
    if ('value' in descriptor && typeof descriptor.value === 'function') {
      const action = descriptor.value as AnyFunction;
      shell.defineAction(key, action);
      continue;
    }

    if (descriptor.get && descriptor.set) {
      Reflect.set(state, key, descriptor.get.call(result));
      shell.defineStateProperty(stateKey(key));
      Object.defineProperty(result, key, {
        enumerable: descriptor.enumerable ?? true,
        configurable: true,
        get() {
          return Reflect.get(state, key);
        },
        set(value: unknown) {
          shell.setStateValue(stateKey(key), value as (typeof state)[keyof typeof state]);
        }
      });
      continue;
    }

    if (descriptor.set && !descriptor.get) {
      throw new Error(`Invalid setup store definition for "${id}". Setter-only properties are not supported.`);
    }

    if (descriptor.get) {
      const getter = descriptor.get;
      shell.defineGetter(key, () => getter.call(shell.store));
      continue;
    }

    Reflect.set(state, key, descriptor.value);
    shell.defineStateProperty(stateKey(key));
  }

  return shell.store;
}
