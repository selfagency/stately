import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { storeToRefs } from './store-to-refs.svelte.js';

describe('storeToRefs', () => {
  it('returns live ref-like wrappers for state and getters while skipping actions', () => {
    const manager = createStateManager();
    const useCounterStore = defineStore('counter-refs', {
      state: () => ({ count: 0 }),
      getters: {
        doubleCount(state) {
          return state.count * 2;
        }
      },
      actions: {
        increment() {
          this.count += 1;
        }
      }
    });

    const counter = useCounterStore(manager);
    const refs = storeToRefs(counter);

    expect(refs).toHaveProperty('count');
    expect(refs).toHaveProperty('doubleCount');
    expect(refs).not.toHaveProperty('increment');
    expect(refs).not.toHaveProperty('$id');

    refs.count.value = 2;
    counter.increment();

    expect(counter.count).toBe(3);
    expect(refs.count.value).toBe(3);
    expect(refs.doubleCount.value).toBe(6);
  });

  it('preserves typed ref access for extracted members', () => {
    const manager = createStateManager();
    const useCounterStore = defineStore('typed-counter-refs', {
      state: () => ({ count: 0 }),
      getters: {
        doubleCount(state) {
          return state.count * 2;
        }
      }
    });

    const refs = storeToRefs(useCounterStore(manager));

    expectTypeOf(refs.count.value).toEqualTypeOf<number>();
    expectTypeOf(refs.doubleCount.value).toEqualTypeOf<number>();
    expect(true).toBe(true);
  });

  it('includes prototype-backed getters from class-based setup stores', () => {
    type CounterStoreShape = Record<string, unknown> & {
      count: number;
      readonly doubleCount: number;
      increment(): void;
    };

    class CounterStore {
      count = 1;

      get doubleCount() {
        return this.count * 2;
      }

      increment() {
        this.count += 1;
      }
    }

    const manager = createStateManager();
    const useCounterStore = defineStore('counter-class-refs', {
      setup: () => new CounterStore() as CounterStoreShape
    });

    const refs = storeToRefs(useCounterStore(manager));

    expect(refs).toHaveProperty('count');
    expect(refs).toHaveProperty('doubleCount');
    expect(refs).not.toHaveProperty('increment');
    expect(refs.doubleCount.value).toBe(2);

    refs.count.value = 3;
    expect(refs.doubleCount.value).toBe(6);
  });
});
