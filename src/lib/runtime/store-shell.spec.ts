import { describe, expect, it, vi } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';

describe('store shell helpers', () => {
  it('adds core shell helpers and routes mutations/actions through them', async () => {
    const manager = createStateManager();
    const useCounterStore = defineStore('counter-shell', {
      state: () => ({ count: 0 }),
      actions: {
        increment(amount = 1) {
          this.count += amount;
          return this.count;
        }
      }
    });

    const counter = useCounterStore(manager);
    const mutations: Array<{ type: string; count: number }> = [];
    const actions: Array<string> = [];

    counter.$subscribe((mutation, state) => {
      mutations.push({ type: mutation.type, count: state.count });
    });
    counter.$onAction(({ name, after }) => {
      actions.push(`start:${name}`);
      after((result) => {
        actions.push(`after:${String(result)}`);
      });
    });

    expect(counter.$id).toBe('counter-shell');
    expect(counter.$state.count).toBe(0);

    counter.$patch({ count: 2 });
    counter.$patch((state) => {
      state.count += 1;
    });
    counter.increment(2);
    counter.$state = { count: 10 };
    counter.$reset();

    expect(counter.count).toBe(0);
    expect(mutations.map((entry) => entry.type)).toEqual([
      'patch-object',
      'patch-function',
      'direct',
      'patch-object',
      'patch-object'
    ]);
    expect(actions).toEqual(['start:increment', 'after:5']);

    counter.$dispose();
    counter.increment();
    expect(mutations).toHaveLength(5);
  });

  it('does not notify subscribers or record mutations after $dispose()', () => {
    const manager = createStateManager();
    const useStore = defineStore('disposed-test', {
      state: () => ({ count: 0 }),
      actions: {
        increment() {
          this.count += 1;
        }
      }
    });

    const store = useStore(manager);
    const mutationSpy = vi.fn();
    store.$subscribe(mutationSpy, { detached: true });

    store.$patch({ count: 1 });
    expect(mutationSpy).toHaveBeenCalledTimes(1);

    store.$dispose();
    store.$patch({ count: 2 });
    store.increment();

    // No additional calls after dispose
    expect(mutationSpy).toHaveBeenCalledTimes(1);
  });

  it('exposes subscribe() and set() for Svelte store contract interop', () => {
    const manager = createStateManager();
    const useStore = defineStore('svelte-contract', {
      state: () => ({ count: 0, label: 'hello' }),
      actions: {
        increment() {
          this.count += 1;
        }
      }
    });

    const store = useStore(manager);
    const values: Array<{ count: number; label: string }> = [];

    const unsubscribe = store.subscribe((value) => {
      values.push({ count: value.count, label: value.label });
    });

    expect(values).toHaveLength(1);
    expect(values[0]).toEqual({ count: 0, label: 'hello' });

    store.$patch({ count: 5 });
    expect(values).toHaveLength(2);
    expect(values[1]).toEqual({ count: 5, label: 'hello' });

    store.set({ count: 42, label: 'updated' });
    expect(store.count).toBe(42);
    expect(store.label).toBe('updated');
    expect(values).toHaveLength(3);
    expect(values[2]).toEqual({ count: 42, label: 'updated' });

    unsubscribe();
    store.$patch({ count: 100 });
    expect(values).toHaveLength(3);
  });

  it('detects cyclic references in state without overflowing the call stack', () => {
    const manager = createStateManager();
    const useStore = defineStore('cyclic-state', {
      state: () => ({ count: 0, nested: {} as Record<string, unknown> }),
      actions: {
        increment() {
          this.count += 1;
        }
      }
    });

    const store = useStore(manager);

    // Introduce a cyclic reference into the state.
    const cycle: Record<string, unknown> = {};
    cycle['self'] = cycle;
    store.$patch({ nested: cycle });

    // Calling increment must not throw a stack-overflow error.
    expect(() => {
      store.increment();
    }).not.toThrow();
    expect(store.count).toBe(1);
  });

  it('notifies subscribers for synchronous mutations in async actions without waiting for resolution', async () => {
    const manager = createStateManager();
    const useStore = defineStore('async-sync-mutation', {
      state: () => ({ count: 0 }),
      actions: {
        async incrementAsync() {
          this.count += 1;
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
          this.count += 1;
        }
      }
    });

    const store = useStore(manager);
    const mutations: string[] = [];
    store.$subscribe((mutation) => {
      mutations.push(mutation.type);
    });

    const promise = store.incrementAsync();

    // Allow queueMicrotask to flush before the async portion settles.
    await Promise.resolve();

    // The synchronous portion mutation should have been recorded.
    expect(mutations.length).toBeGreaterThanOrEqual(1);

    await promise;

    // After full resolution, the second mutation should also be recorded.
    expect(mutations.length).toBeGreaterThanOrEqual(2);
  });
});
