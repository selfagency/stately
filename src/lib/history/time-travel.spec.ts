import { describe, expect, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createPersistencePlugin } from '../persistence/plugin.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createSyncPlugin } from '../sync/plugin.svelte.js';
import { createHistoryPlugin } from './plugin.svelte.js';

describe('time-travel replay', () => {
  it('replays historical snapshots through patching without triggering persistence or sync loops', async () => {
    const storage = new Map<string, string>();
    const published: unknown[] = [];
    const manager = createStateManager()
      .use(createPersistencePlugin())
      .use(createHistoryPlugin())
      .use(
        createSyncPlugin({
          origin: 'local-origin',
          transports: [
            {
              publish(message) {
                published.push(message);
              },
              subscribe() {
                return () => {};
              },
              destroy() {}
            }
          ]
        })
      );
    const useCounterStore = defineStore('time-travel-counter', {
      state: () => ({ count: 0 }),
      history: { limit: 10 },
      persist: {
        version: 1,
        adapter: {
          async getItem(key: string) {
            return storage.get(key) ?? null;
          },
          async setItem(key: string, value: string) {
            storage.set(key, value);
          },
          async removeItem(key: string) {
            storage.delete(key);
          }
        }
      }
    } as {
      state: () => { count: number };
      history: { limit: number };
      persist: {
        version: number;
        adapter: {
          getItem(key: string): Promise<string | null>;
          setItem(key: string, value: string): Promise<void>;
          removeItem(key: string): Promise<void>;
        };
      };
    });
    const counter = useCounterStore(manager);

    await counter.$persist.ready;
    counter.count = 1;
    counter.count = 2;
    await counter.$persist.flush();

    const publishCountBeforeReplay = published.length;
    const persistedBeforeReplay = storage.get('time-travel-counter');

    counter.$timeTravel.goTo(0);

    expect(counter.count).toBe(0);
    expect(counter.$timeTravel.currentIndex).toBe(0);
    expect(counter.$timeTravel.isReplaying).toBe(false);
    expect(published).toHaveLength(publishCountBeforeReplay);
    expect(storage.get('time-travel-counter')).toBe(persistedBeforeReplay);
  });
});
