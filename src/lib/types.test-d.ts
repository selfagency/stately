/**
 * Type-level tests for the Stately public API.
 *
 * These tests are statically analyzed by the TypeScript compiler via
 * `vitest --typecheck`. They never execute at runtime.
 *
 * @see https://vitest.dev/guide/testing-types.html
 */
import { describe, expectTypeOf, it } from 'vitest';
import { defineStore, storeToRefs, createStateManager } from './index.js';
import type { StoreInstance, StoreMutationContext, StoreActionHookContext, StoreRef } from './index.js';

// ---------------------------------------------------------------------------
// Option store type flow
// ---------------------------------------------------------------------------

describe('option store types', () => {
  const useCounter = defineStore('counter', {
    state: () => ({ count: 0, label: 'hello' }),
    getters: {
      doubled(state) {
        return state.count * 2;
      },
      upperLabel(state) {
        return state.label.toUpperCase();
      }
    },
    actions: {
      increment() {
        this.count += 1;
      },
      setLabel(newLabel: string) {
        this.label = newLabel;
      }
    }
  });

  it('infers the store definition id literal', () => {
    expectTypeOf(useCounter.$id).toEqualTypeOf<'counter'>();
  });

  it('infers state properties on the store instance', () => {
    const store = useCounter(createStateManager());
    expectTypeOf(store.count).toEqualTypeOf<number>();
    expectTypeOf(store.label).toEqualTypeOf<string>();
  });

  it('infers getter return types as readonly', () => {
    const store = useCounter(createStateManager());
    expectTypeOf(store.doubled).toEqualTypeOf<number>();
    expectTypeOf(store.upperLabel).toEqualTypeOf<string>();
  });

  it('infers action signatures', () => {
    const store = useCounter(createStateManager());
    expectTypeOf(store.increment).toBeFunction();
    expectTypeOf(store.increment).parameters.toEqualTypeOf<[]>();
    expectTypeOf(store.setLabel).parameter(0).toBeString();
  });

  it('types $state as the state shape without getters or actions', () => {
    const store = useCounter(createStateManager());
    expectTypeOf(store.$state).toEqualTypeOf<{ count: number; label: string }>();
  });

  it('types $patch to accept partial state or mutator function', () => {
    const store = useCounter(createStateManager());
    // Object patch
    expectTypeOf(store.$patch)
      .parameter(0)
      .toExtend<Partial<{ count: number; label: string }> | ((state: { count: number; label: string }) => void)>();
  });

  it('types $id as the literal store id', () => {
    const store = useCounter(createStateManager());
    expectTypeOf(store.$id).toEqualTypeOf<'counter'>();
  });

  it('types $subscribe callback with correct mutation context', () => {
    const store = useCounter(createStateManager());
    store.$subscribe((mutation, state) => {
      expectTypeOf(mutation.storeId).toEqualTypeOf<'counter'>();
      expectTypeOf(mutation.type).toEqualTypeOf<'direct' | 'patch-object' | 'patch-function'>();
      expectTypeOf(state).toEqualTypeOf<{ count: number; label: string }>();
    });
  });

  it('types $onAction with correct hook context', () => {
    const store = useCounter(createStateManager());
    store.$onAction((ctx) => {
      expectTypeOf(ctx.name).toBeString();
      expectTypeOf(ctx.args).toEqualTypeOf<unknown[]>();
      expectTypeOf(ctx.before).toBeFunction();
      expectTypeOf(ctx.after).toBeFunction();
      expectTypeOf(ctx.onError).toBeFunction();
    });
  });

  it('exposes $reset and $dispose', () => {
    const store = useCounter(createStateManager());
    expectTypeOf(store.$reset).toBeFunction();
    expectTypeOf(store.$dispose).toBeFunction();
  });

  it('rejects non-plain-object state at the type level', () => {
    // @ts-expect-error Arrays are not valid option store state
    defineStore('bad-array', { state: () => [1, 2, 3] });

    // @ts-expect-error Maps are not valid option store state
    defineStore('bad-map', { state: () => new Map() });

    // @ts-expect-error Functions are not valid option store state
    defineStore('bad-fn', { state: () => () => {} });
  });
});

// ---------------------------------------------------------------------------
// Setup store type flow
// ---------------------------------------------------------------------------

describe('setup store types', () => {
  const useTodos = defineStore('todos', () => ({
    items: [] as string[],
    filter: 'all' as 'all' | 'done' | 'pending',
    add(item: string) {
      this.items.push(item);
    },
    clear() {
      this.items = [];
    }
  }));

  it('infers setup store state without actions', () => {
    const store = useTodos(createStateManager());
    expectTypeOf(store.items).toEqualTypeOf<string[]>();
    expectTypeOf(store.filter).toEqualTypeOf<'all' | 'done' | 'pending'>();
  });

  it('infers setup store actions', () => {
    const store = useTodos(createStateManager());
    expectTypeOf(store.add).toBeFunction();
    expectTypeOf(store.add).parameter(0).toBeString();
    expectTypeOf(store.clear).toBeFunction();
    expectTypeOf(store.clear).parameters.toEqualTypeOf<[]>();
  });

  it('does not include actions in $state type', () => {
    type Store = ReturnType<typeof useTodos>;
    type State = Store['$state'];
    expectTypeOf<State>().toEqualTypeOf<{
      items: string[];
      filter: 'all' | 'done' | 'pending';
    }>();
  });

  it('does not leak actions into $patch partial type', () => {
    const store = useTodos(createStateManager());
    // Valid: patching state properties
    store.$patch({ items: ['test'] });
    store.$patch({ filter: 'done' });

    // $patch should accept Partial<State> which should NOT include action keys
    type PatchArg = Parameters<typeof store.$patch>[0];
    expectTypeOf<{ items: string[] }>().toExtend<PatchArg>();
    // Actions should not be extendable to patch arg as object
    expectTypeOf<{ add: () => void }>().not.toExtend<PatchArg>();
  });
});

// ---------------------------------------------------------------------------
// Setup store with options (DefineSetupStoreOptions)
// ---------------------------------------------------------------------------

describe('setup store with options', () => {
  const useNotes = defineStore('notes', {
    setup: () => ({
      notes: [] as string[],
      addNote(note: string) {
        this.notes.push(note);
      }
    })
  });

  it('infers state and actions from setup options', () => {
    const store = useNotes(createStateManager());
    expectTypeOf(store.notes).toEqualTypeOf<string[]>();
    expectTypeOf(store.addNote).toBeFunction();
    expectTypeOf(store.addNote).parameter(0).toBeString();
  });

  it('does not include actions in $state for setup options stores', () => {
    type Store = ReturnType<typeof useNotes>;
    type State = Store['$state'];
    expectTypeOf<State>().toEqualTypeOf<{ notes: string[] }>();
  });
});

// ---------------------------------------------------------------------------
// StoreDefinition callable type
// ---------------------------------------------------------------------------

describe('StoreDefinition callable type', () => {
  it('is callable with optional manager parameter', () => {
    const useFoo = defineStore('foo', { state: () => ({ x: 1 }) });
    expectTypeOf(useFoo).toBeCallableWith(createStateManager());
    expectTypeOf(useFoo).toBeCallableWith();
  });

  it('preserves id and store types through the definition', () => {
    const useFoo = defineStore('foo', {
      state: () => ({ x: 1 }),
      getters: {
        doubled(state) {
          return state.x * 2;
        }
      },
      actions: {
        inc() {
          this.x += 1;
        }
      }
    });

    type Def = typeof useFoo;
    expectTypeOf<Def['$id']>().toEqualTypeOf<'foo'>();

    const store = useFoo(createStateManager());
    expectTypeOf(store.x).toBeNumber();
    expectTypeOf(store.doubled).toBeNumber();
    expectTypeOf(store.inc).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// storeToRefs
// ---------------------------------------------------------------------------

describe('storeToRefs types', () => {
  const useCounter = defineStore('refs-counter', {
    state: () => ({ count: 0, name: 'test' }),
    getters: {
      doubled(state) {
        return state.count * 2;
      }
    },
    actions: {
      increment() {
        this.count += 1;
      }
    }
  });

  it('excludes actions and $ methods from refs', () => {
    const store = useCounter(createStateManager());
    const refs = storeToRefs(store);

    // State and getters should be present as refs
    expectTypeOf(refs.count).toEqualTypeOf<StoreRef<number>>();
    expectTypeOf(refs.name).toEqualTypeOf<StoreRef<string>>();
    expectTypeOf(refs.doubled).toEqualTypeOf<StoreRef<number>>();

    // Actions and $ methods should be excluded
    type RefKeys = keyof typeof refs;
    expectTypeOf<'increment'>().not.toExtend<RefKeys>();
    expectTypeOf<'$id'>().not.toExtend<RefKeys>();
    expectTypeOf<'$state'>().not.toExtend<RefKeys>();
    expectTypeOf<'$patch'>().not.toExtend<RefKeys>();
    expectTypeOf<'$reset'>().not.toExtend<RefKeys>();
    expectTypeOf<'$subscribe'>().not.toExtend<RefKeys>();
    expectTypeOf<'$onAction'>().not.toExtend<RefKeys>();
    expectTypeOf<'$dispose'>().not.toExtend<RefKeys>();
  });

  it('wraps values in StoreRef with getter/setter', () => {
    const store = useCounter(createStateManager());
    const refs = storeToRefs(store);
    expectTypeOf(refs.count.value).toBeNumber();
  });
});

// ---------------------------------------------------------------------------
// Plugin augmentation
// ---------------------------------------------------------------------------

describe('plugin augmentation types', () => {
  it('exposes $persist on stores via module augmentation', () => {
    const useStore = defineStore('persist-test', {
      state: () => ({ x: 1 })
    });
    const store = useStore(createStateManager());

    // These should exist from StoreCustomProperties augmentation
    expectTypeOf(store.$persist).toHaveProperty('flush');
    expectTypeOf(store.$persist).toHaveProperty('rehydrate');
    expectTypeOf(store.$persist).toHaveProperty('clear');
    expectTypeOf(store.$persist).toHaveProperty('pause');
    expectTypeOf(store.$persist).toHaveProperty('resume');
    expectTypeOf(store.$persist).toHaveProperty('ready');
  });

  it('exposes $history and $timeTravel on stores via module augmentation', () => {
    const useStore = defineStore('history-test', {
      state: () => ({ x: 1 })
    });
    const store = useStore(createStateManager());

    expectTypeOf(store.$history).toHaveProperty('canUndo');
    expectTypeOf(store.$history).toHaveProperty('canRedo');
    expectTypeOf(store.$history).toHaveProperty('undo');
    expectTypeOf(store.$history).toHaveProperty('redo');
    expectTypeOf(store.$timeTravel).toHaveProperty('isReplaying');
  });

  it('exposes $async on stores via module augmentation', () => {
    const useStore = defineStore('async-test', {
      state: () => ({ x: 1 }),
      actions: {
        async fetchData() {
          return 'data';
        }
      }
    });
    const store = useStore(createStateManager());

    expectTypeOf(store.$async).toBeObject();
  });

  it('exposes $fsm on stores via module augmentation', () => {
    const useStore = defineStore('fsm-test', {
      state: () => ({ x: 1 })
    });
    const store = useStore(createStateManager());

    expectTypeOf(store.$fsm).toHaveProperty('current');
    expectTypeOf(store.$fsm).toHaveProperty('send');
    expectTypeOf(store.$fsm).toHaveProperty('matches');
    expectTypeOf(store.$fsm).toHaveProperty('can');
  });

  it('accepts persist and history in DefineStoreOptionsBase', () => {
    // This should compile without errors
    defineStore('augmented-options', {
      state: () => ({ count: 0 }),
      persist: {
        adapter: {
          getItem: async () => null,
          setItem: async () => {},
          removeItem: async () => {}
        },
        version: 1
      },
      history: { limit: 50 }
    });
  });
});

// ---------------------------------------------------------------------------
// Selective subscriptions
// ---------------------------------------------------------------------------

describe('selective subscription types', () => {
  it('types select and equalityFn generics correctly', () => {
    const useStore = defineStore('select-test', {
      state: () => ({ count: 0, name: 'hello' })
    });
    const store = useStore(createStateManager());

    store.$subscribe(
      (mutation, state) => {
        expectTypeOf(state).toEqualTypeOf<{ count: number; name: string }>();
      },
      {
        select: (state) => {
          expectTypeOf(state).toEqualTypeOf<{ count: number; name: string }>();
          return state.count;
        },
        equalityFn: (prev, next) => {
          expectTypeOf(prev).toBeNumber();
          expectTypeOf(next).toBeNumber();
          return prev === next;
        }
      }
    );
  });
});

// ---------------------------------------------------------------------------
// StoreInstance composition type
// ---------------------------------------------------------------------------

describe('StoreInstance type composition', () => {
  it('is an intersection of State, Getters, Actions, and ShellMethods', () => {
    type MyStore = StoreInstance<'test', { count: number }, { doubled: number }, { increment: () => void }>;

    // State
    expectTypeOf<MyStore['count']>().toBeNumber();
    // Getters (readonly)
    expectTypeOf<MyStore['doubled']>().toBeNumber();
    // Actions
    expectTypeOf<MyStore['increment']>().toBeFunction();
    // Shell methods
    expectTypeOf<MyStore['$id']>().toEqualTypeOf<'test'>();
    expectTypeOf<MyStore['$state']>().toEqualTypeOf<{ count: number }>();
    expectTypeOf<MyStore['$patch']>().toBeFunction();
    expectTypeOf<MyStore['$reset']>().toBeFunction();
    expectTypeOf<MyStore['$subscribe']>().toBeFunction();
    expectTypeOf<MyStore['$onAction']>().toBeFunction();
    expectTypeOf<MyStore['$dispose']>().toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// StoreMutationContext and StoreActionHookContext
// ---------------------------------------------------------------------------

describe('context types', () => {
  it('types StoreMutationContext with store id literal', () => {
    type Ctx = StoreMutationContext<'my-store'>;
    expectTypeOf<Ctx['storeId']>().toEqualTypeOf<'my-store'>();
    expectTypeOf<Ctx['type']>().toEqualTypeOf<'direct' | 'patch-object' | 'patch-function'>();
    expectTypeOf<Ctx['payload']>().toEqualTypeOf<unknown | undefined>();
  });

  it('types StoreActionHookContext generics', () => {
    type Ctx = StoreActionHookContext<{ x: number }, 'doThing', [string, number], boolean>;
    expectTypeOf<Ctx['name']>().toEqualTypeOf<'doThing'>();
    expectTypeOf<Ctx['args']>().toEqualTypeOf<[string, number]>();
    expectTypeOf<Ctx['before']>().toBeFunction();
    expectTypeOf<Ctx['after']>().toBeFunction();
    expectTypeOf<Ctx['onError']>().toBeFunction();
  });
});
