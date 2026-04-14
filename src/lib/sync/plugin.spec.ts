import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createSyncPlugin } from './plugin.svelte.js';
import type { SyncMessage, SyncTransport } from './types.js';

describe('createSyncPlugin', () => {
  it('publishes store snapshots and applies inbound messages for the same store', () => {
    const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
    const published: unknown[] = [];
    const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
      publish(message) {
        published.push(message);
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      destroy() {
        listeners.clear();
      }
    };
    const manager = createStateManager().use(
      createSyncPlugin({
        origin: 'local-origin',
        createId: () => 1,
        createTimestamp: () => 123,
        transports: [transport]
      })
    );
    const useCounterStore = defineStore('counter-sync', {
      state: () => ({ count: 0 })
    });
    const counter = useCounterStore(manager);

    counter.$patch({ count: 2 });

    expect(published[0]).toMatchObject({
      storeId: 'counter-sync',
      origin: 'local-origin',
      mutationId: 1,
      timestamp: 123,
      state: { count: 2 }
    });

    for (const listener of listeners) {
      listener({
        storeId: 'counter-sync',
        origin: 'remote-origin',
        mutationId: 2,
        timestamp: 456,
        version: 1,
        state: { count: 7 }
      });
    }

    expect(counter.count).toBe(7);

    for (const listener of listeners) {
      listener({
        storeId: 'counter-sync',
        origin: 'remote-origin',
        mutationId: 3,
        timestamp: 789,
        version: 1,
        state: null
      } as unknown as SyncMessage<Record<string, unknown>>);
    }

    expect(counter.count).toBe(7);
  });

  it('rejects inbound messages with a mismatched version', () => {
    const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
    const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
      publish() {},
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      destroy() {
        listeners.clear();
      }
    };
    const manager = createStateManager().use(
      createSyncPlugin({ origin: 'local', version: 2, transports: [transport] })
    );
    const useStore = defineStore('ver-check-store', { state: () => ({ count: 0 }) });
    const store = useStore(manager);

    for (const listener of listeners) {
      listener({
        storeId: 'ver-check-store',
        origin: 'remote',
        mutationId: 1,
        timestamp: 1,
        version: 1,
        state: { count: 99 }
      });
    }
    expect(store.count).toBe(0);

    for (const listener of listeners) {
      listener({
        storeId: 'ver-check-store',
        origin: 'remote',
        mutationId: 2,
        timestamp: 2,
        version: 2,
        state: { count: 42 }
      });
    }
    expect(store.count).toBe(42);
  });

  it('leaves $dispose configurable so multiple plugins can chain cleanup', () => {
    const destroyed: string[] = [];
    const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
      publish() {},
      subscribe() {
        return () => {};
      },
      destroy() {
        destroyed.push('transport');
      }
    };
    const manager = createStateManager().use(createSyncPlugin({ origin: 'local', transports: [transport] }));
    const useStore = defineStore('dispose-chain-store', { state: () => ({ v: 0 }) });
    const store = useStore(manager);

    const previousDispose = store.$dispose.bind(store);
    Object.defineProperty(store, '$dispose', {
      value() {
        destroyed.push('outer');
        previousDispose();
      },
      configurable: true,
      writable: true,
      enumerable: false
    });

    store.$dispose();
    expect(destroyed).toEqual(['outer', 'transport']);
  });

  it('rejects stale cross-origin messages when a newer local mutation already won', () => {
    const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
    const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
      publish() {},
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      destroy() {
        listeners.clear();
      }
    };
    const manager = createStateManager().use(
      createSyncPlugin({
        origin: 'local-origin',
        createId: () => 1,
        createTimestamp: () => 200,
        transports: [transport]
      })
    );
    const useStore = defineStore('cross-origin-ordering', { state: () => ({ count: 0 }) });
    const store = useStore(manager);

    store.$patch({ count: 10 });

    for (const listener of listeners) {
      listener({
        storeId: 'cross-origin-ordering',
        origin: 'remote-origin',
        mutationId: 5,
        timestamp: 100,
        version: 1,
        state: { count: 2 }
      });
    }

    expect(store.count).toBe(10);

    for (const listener of listeners) {
      listener({
        storeId: 'cross-origin-ordering',
        origin: 'remote-origin',
        mutationId: 6,
        timestamp: 300,
        version: 1,
        state: { count: 12 }
      });
    }

    expect(store.count).toBe(12);
  });

  it('deduplicates the same remote mutation delivered by multiple transports', () => {
    const firstListeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
    const secondListeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
    const createTransport = (
      listeners: Set<(message: SyncMessage<Record<string, unknown>>) => void>
    ): SyncTransport<SyncMessage<Record<string, unknown>>> => ({
      publish() {},
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      destroy() {
        listeners.clear();
      }
    });
    const manager = createStateManager().use(
      createSyncPlugin({
        origin: 'local-origin',
        transports: [createTransport(firstListeners), createTransport(secondListeners)]
      })
    );
    const useStore = defineStore('duplicate-transport-delivery', { state: () => ({ count: 0 }) });
    const store = useStore(manager);
    const mutations: string[] = [];

    store.$subscribe((mutation) => {
      mutations.push(mutation.type);
    });

    const duplicatedMessage = {
      storeId: 'duplicate-transport-delivery',
      origin: 'remote-origin',
      mutationId: 1,
      timestamp: 500,
      version: 1,
      state: { count: 9 }
    } satisfies SyncMessage<Record<string, unknown>>;

    for (const listener of firstListeners) {
      listener(duplicatedMessage);
    }
    for (const listener of secondListeners) {
      listener(duplicatedMessage);
    }

    expect(store.count).toBe(9);
    expect(mutations).toEqual(['patch-object']);
  });

  it('uses a deterministic origin tie-breaker when timestamps match', () => {
    const listeners = new Set<(message: SyncMessage<Record<string, unknown>>) => void>();
    const transport: SyncTransport<SyncMessage<Record<string, unknown>>> = {
      publish() {},
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      destroy() {
        listeners.clear();
      }
    };
    const manager = createStateManager().use(
      createSyncPlugin({ origin: 'alpha', createId: () => 1, createTimestamp: () => 250, transports: [transport] })
    );
    const useStore = defineStore('timestamp-tie-breaker', { state: () => ({ count: 0 }) });
    const store = useStore(manager);

    store.$patch({ count: 1 });

    for (const listener of listeners) {
      listener({
        storeId: 'timestamp-tie-breaker',
        origin: 'beta',
        mutationId: 1,
        timestamp: 250,
        version: 1,
        state: { count: 2 }
      });
    }

    expect(store.count).toBe(2);
  });

  it('preserves interface-based state types through typed sync messages', () => {
    interface SyncState {
      count: number;
      label: string;
    }

    type TaggedSyncMessage = SyncMessage<SyncState> & { source: 'typed-test' };
    const listeners = new Set<(message: TaggedSyncMessage) => void>();
    const published: TaggedSyncMessage[] = [];
    const transport: SyncTransport<TaggedSyncMessage> = {
      publish(message) {
        expectTypeOf(message.state.count).toEqualTypeOf<number>();
        expectTypeOf(message.state.label).toEqualTypeOf<string>();
        published.push(message);
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      destroy() {
        listeners.clear();
      }
    };
    const manager = createStateManager().use(
      createSyncPlugin<TaggedSyncMessage>({
        origin: 'typed-origin',
        transports: [transport],
        createMessage(base) {
          expectTypeOf(base.state).toEqualTypeOf<object>();
          return { ...(base as SyncMessage<SyncState>), source: 'typed-test' };
        }
      })
    );
    const useStore = defineStore('typed-sync', {
      state: (): SyncState => ({ count: 0, label: 'ready' })
    });
    const store = useStore(manager);

    store.$patch({ count: 5, label: 'sent' });

    expect(published[0]?.source).toBe('typed-test');
    expect(published[0]?.state).toEqual({ count: 5, label: 'sent' });
  });
});
