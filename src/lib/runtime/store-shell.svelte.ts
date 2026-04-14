import type { StatelyInspectorHook } from '../inspector/types.js';
import { writeMarker } from '../internal/marker-helpers.js';
import type {
  StoreActionHookContext,
  StoreMutationContext,
  StoreState,
  StoreSubscribeOptions
} from '../pinia-like/store-types.js';
import { ASYNC_ACTION_MARKER } from './async-marker.js';
import { createDevtoolsTimelineRecorder } from './devtools-timeline.svelte.js';
import { createMutationQueue } from './mutation-queue.svelte.js';
import { createSubscriptions } from './subscriptions.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

const statelyInspectorHookKey = Symbol.for('stately.inspector.hook');

export interface StoreShell<Id extends string, State extends StoreState, Store extends object> {
  readonly $id: Id;
  $state: State;
  $patch(partial: Partial<State> | ((state: State) => void)): void;
  $reset(): void;
  $subscribe(
    callback: (mutation: StoreMutationContext<Id, Store>, state: State) => void,
    options?: StoreSubscribeOptions<State>
  ): () => void;
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

  if (left === null || right === null) {
    return false;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    if (visited.has(left)) {
      return false;
    }
    visited.add(left);
    visited.add(right);

    for (let index = 0; index < left.length; index += 1) {
      if (!isStateEqual(Reflect.get(left, index), Reflect.get(right, index), visited)) {
        return false;
      }
    }

    return true;
  }

  if (typeof left === 'object' && typeof right === 'object') {
    if ((left as object).constructor !== (right as object).constructor) {
      return false;
    }

    if (left instanceof Date) {
      return left.getTime() === (right as Date).getTime();
    }

    if (left instanceof RegExp) {
      return left.source === (right as RegExp).source && left.flags === (right as RegExp).flags;
    }

    if (left instanceof Map) {
      const r = right as Map<unknown, unknown>;
      if (left.size !== r.size) return false;
      for (const [k, v] of left) {
        if (!r.has(k) || !isStateEqual(v, r.get(k), visited)) return false;
      }
      return true;
    }

    if (left instanceof Set) {
      const r = right as Set<unknown>;
      if (left.size !== r.size) return false;
      for (const v of left) {
        if (!r.has(v)) return false;
      }
      return true;
    }

    if (visited.has(left)) {
      return false;
    }
    visited.add(left);
    visited.add(right);

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function createStoreShell<Id extends string, State extends StoreState, Store extends object>(config: {
  id: Id;
  store: Store;
  state: State;
  onDispose?: () => void;
}): StoreShellBuilder<Id, State, Store> {
  if (!isPlainObject(config.state)) {
    throw new Error(
      `[Stately] Store "${config.id}" state() must return a plain object. Received: ${Object.prototype.toString.call(config.state)}.`
    );
  }

  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    for (const [key, value] of Object.entries(config.state)) {
      if (value instanceof Map || value instanceof Set) {
        console.warn(
          `[Stately] Store "${config.id}" initialized with a native ${value.constructor.name} at key "${key}". Svelte 5 deep reactivity does not proxy native Maps or Sets. Consider using SvelteMap or SvelteSet from 'svelte/reactivity'.`
        );
      }
    }
  }

  let suppressDirectMutation = false;
  let disposed = false;
  let mutationCount = 0;
  const initialState = cloneState(config.state);
  const shellStore = config.store as Store & StoreShell<Id, State, Store & StoreShell<Id, State, Store>>;
  const timeline = createDevtoolsTimelineRecorder({
    storeId: config.id,
    readSnapshot: () => cloneState(config.state)
  });
  // Store subscriptions are the explicit side-effect boundary for the runtime.
  // This keeps listener lifecycle under manual control for detached subscriptions,
  // plugin wrappers, and $dispose cleanup instead of relying on implicit $effect teardown.
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
      // Snapshot the state before the action so we can detect direct mutations after it runs.
      // NOTE: $state.snapshot() is O(n) in state size. This snapshot is only compared when
      // no explicit mutation (via $patch, $reset, etc.) was recorded during the action —
      // if mutationCount changed, flushInferredDirectMutation returns early without diff-ing.
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

    if (action.constructor?.name === 'AsyncFunction') {
      writeMarker<boolean>(actionWithMutationInference, ASYNC_ACTION_MARKER, true);
    }

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
          try {
            syncState(config.state, nextState);
          } finally {
            suppressDirectMutation = false;
          }
        });
      }
    },
    $patch: {
      enumerable: false,
      configurable: true,
      value(patch: Partial<State> | ((state: State) => void)) {
        if (typeof patch === 'function') {
          mutationQueue.run('patch-function', undefined, () => {
            patch(config.state);
          });
          return;
        }

        mutationQueue.run('patch-object', patch, () => {
          // Direct property setters already enqueue mutation records. Suppress them here so
          // object patches emit a single coherent mutation through the shared pipeline.
          suppressDirectMutation = true;
          try {
            for (const [key, value] of Object.entries(patch)) {
              Reflect.set(config.state, key, value);
            }
          } finally {
            suppressDirectMutation = false;
          }
        });
      }
    },
    $reset: {
      enumerable: false,
      configurable: false,
      value() {
        mutationQueue.run('patch-object', initialState, () => {
          suppressDirectMutation = true;
          try {
            syncState(config.state, cloneState(initialState));
          } finally {
            suppressDirectMutation = false;
          }
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
          try {
            syncState(config.state, value);
          } finally {
            suppressDirectMutation = false;
          }
        });
      }
    }
  });

  const globalHook = Reflect.get(globalThis, statelyInspectorHookKey) as StatelyInspectorHook | undefined;
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
