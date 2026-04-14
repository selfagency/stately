import { reportStatelyInspectorNotice } from '../inspector/notice.js';
import { sanitizeValue } from '../internal/sanitize.js';
import type { StoreCustomProperties, StoreMutationContext, StoreState } from '../pinia-like/store-types.js';
import { defineStateManagerPlugin, type StateManagerPlugin, type StoreDefinition } from '../root/types.js';
import { deserializePersistedState, serializePersistedState } from './serialize.js';
import type { PersistController, PersistOptions, PersistenceAdapter } from './types.js';

interface PersistableStore<State extends object = StoreState> {
  readonly $id: string;
  $state: State;
  $patch(patch: Partial<State> | ((state: State) => void)): void;
  $subscribe(callback: (mutation: StoreMutationContext, state: State) => void): () => void;
  $dispose(): void;
}

declare module '../pinia-like/store-types.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreCustomProperties<State extends StoreState = StoreState, Store extends object = object> {
    $persist: PersistController;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPersistableStore(value: unknown): value is PersistableStore {
  return isRecord(value) && '$state' in value && '$patch' in value && '$subscribe' in value;
}

function isPersistenceAdapter(value: unknown): value is PersistenceAdapter {
  return (
    isRecord(value) &&
    typeof value.getItem === 'function' &&
    typeof value.setItem === 'function' &&
    typeof value.removeItem === 'function'
  );
}

function isReplayActive(store: PersistableStore): boolean {
  return (
    '$timeTravel' in store && isRecord(store.$timeTravel) && Reflect.get(store.$timeTravel, 'isReplaying') === true
  );
}

function readPersistOptions<State extends object>(value: unknown): PersistOptions<State> | undefined {
  if (!isRecord(value) || !('persist' in value)) {
    return undefined;
  }

  const persist = value.persist;
  if (!isRecord(persist)) {
    return undefined;
  }

  if (!isPersistenceAdapter(persist.adapter)) {
    throw new Error('Invalid persist configuration: adapter must implement getItem, setItem, and removeItem.');
  }

  if (typeof persist.version !== 'number' || !Number.isFinite(persist.version)) {
    throw new Error('Invalid persist configuration: version must be a finite number.');
  }

  if (Array.isArray(persist.pick) && Array.isArray(persist.omit)) {
    throw new Error('Invalid persist configuration: pick and omit cannot be used together.');
  }

  const result: PersistOptions<State> = {
    adapter: persist.adapter,
    version: persist.version
  };

  if (persist.key !== undefined) {
    if (typeof persist.key !== 'string') throw new Error('Invalid persist configuration: key must be a string.');
    result.key = persist.key;
  }
  if (persist.pick !== undefined) {
    if (!Array.isArray(persist.pick)) throw new Error('Invalid persist configuration: pick must be an array.');
    result.pick = persist.pick as (keyof State)[];
  }
  if (persist.omit !== undefined) {
    if (!Array.isArray(persist.omit)) throw new Error('Invalid persist configuration: omit must be an array.');
    result.omit = persist.omit as (keyof State)[];
  }
  if (persist.compression !== undefined) {
    if (
      !isRecord(persist.compression) ||
      typeof persist.compression.compress !== 'function' ||
      typeof persist.compression.decompress !== 'function'
    ) {
      throw new Error('Invalid persist configuration: compression must implement compress and decompress functions.');
    }
    result.compression = persist.compression as unknown as PersistOptions<State>['compression'];
  }
  if (persist.serialize !== undefined) {
    if (typeof persist.serialize !== 'function')
      throw new Error('Invalid persist configuration: serialize must be a function.');
    result.serialize = persist.serialize as PersistOptions<State>['serialize'];
  }
  if (persist.deserialize !== undefined) {
    if (typeof persist.deserialize !== 'function')
      throw new Error('Invalid persist configuration: deserialize must be a function.');
    result.deserialize = persist.deserialize as PersistOptions<State>['deserialize'];
  }
  if (persist.migrate !== undefined) {
    if (typeof persist.migrate !== 'function')
      throw new Error('Invalid persist configuration: migrate must be a function.');
    result.migrate = persist.migrate as PersistOptions<State>['migrate'];
  }
  if (persist.onError !== undefined) {
    if (typeof persist.onError !== 'function')
      throw new Error('Invalid persist configuration: onError must be a function.');
    result.onError = persist.onError as PersistOptions<State>['onError'];
  }
  if (persist.debounce !== undefined) {
    if (typeof persist.debounce !== 'number' || !Number.isFinite(persist.debounce))
      throw new Error('Invalid persist configuration: debounce must be a finite number.');
    result.debounce = persist.debounce;
  }
  if (persist.ttl !== undefined) {
    if (typeof persist.ttl !== 'number' || !Number.isFinite(persist.ttl))
      throw new Error('Invalid persist configuration: ttl must be a finite number.');
    result.ttl = persist.ttl;
  }

  return result;
}

type PersistencePluginAugmentation = Pick<StoreCustomProperties, '$persist'>;

export function createPersistencePlugin(): StateManagerPlugin<
  StoreDefinition,
  PersistableStore,
  PersistencePluginAugmentation
> {
  return defineStateManagerPlugin<StoreDefinition, PersistableStore, PersistencePluginAugmentation>(
    ({ options, store }) => {
      if (!isPersistableStore(store)) {
        return;
      }

      const persist = readPersistOptions<typeof store.$state>(options);
      if (!persist) {
        return;
      }

      const pickKeys = persist.pick as string[] | undefined;
      const omitKeys = persist.omit as string[] | undefined;

      function filterState(snapshot: typeof store.$state): typeof store.$state {
        const source = snapshot as Record<string, unknown>;
        if (pickKeys) {
          return Object.fromEntries(
            Object.entries(source).filter(([key]) => pickKeys.includes(key))
          ) as typeof store.$state;
        }
        if (omitKeys) {
          return Object.fromEntries(
            Object.entries(source).filter(([key]) => !omitKeys.includes(key))
          ) as typeof store.$state;
        }
        return snapshot;
      }

      const key = persist.key ?? store.$id;
      const serialize = persist.serialize ?? serializePersistedState;
      const customDeserialize = persist.deserialize;
      const compression = persist.compression;
      let paused = false;
      let rehydrating = false;
      let flushQueue = Promise.resolve();
      let debounceTimer: ReturnType<typeof setTimeout> | undefined;

      const cancelDebouncedFlush = () => {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
      };

      const flush = async () => {
        if (paused || rehydrating || isReplayActive(store)) {
          return;
        }

        const snapshot = filterState($state.snapshot(store.$state) as typeof store.$state);
        const payload = serialize({
          version: persist.version,
          state: snapshot
        });

        let encoded: string;
        try {
          encoded = compression ? compression.compress(payload) : payload;
        } catch {
          reportStatelyInspectorNotice(`Compression failed for store "${store.$id}". Falling back to uncompressed.`);
          encoded = payload;
        }

        if (persist.ttl) {
          encoded = JSON.stringify({ __stately_ttl: Date.now() + persist.ttl, data: encoded });
        }

        const queuedWrite = flushQueue
          .catch(() => undefined)
          .then(async () => {
            await persist.adapter.setItem(key, encoded);
          });
        flushQueue = queuedWrite;
        return queuedWrite;
      };

      const rehydrate = async () => {
        let raw = await persist.adapter.getItem(key);
        if (!raw) {
          return false;
        }

        if (persist.ttl) {
          try {
            const wrapper = JSON.parse(raw);
            if (isRecord(wrapper) && typeof wrapper.__stately_ttl === 'number' && typeof wrapper.data === 'string') {
              if (Date.now() > wrapper.__stately_ttl) {
                return false;
              }
              raw = wrapper.data;
            }
          } catch {
            // Not a TTL envelope; continue with the raw payload.
          }
        }

        let source: string | undefined;
        try {
          source = compression ? compression.decompress(raw) : raw;
        } catch {
          reportStatelyInspectorNotice(`Decompression failed for store "${store.$id}".`);
          return false;
        }

        if (!source) {
          return false;
        }

        if (customDeserialize) {
          const parsed = customDeserialize(source);
          if (!parsed) {
            return false;
          }

          rehydrating = true;
          try {
            store.$patch(sanitizeValue(parsed.state) as Partial<typeof store.$state>);
            return true;
          } finally {
            rehydrating = false;
          }
        }

        const result = deserializePersistedState(source, persist);
        if (!result.ok) {
          reportStatelyInspectorNotice(`Rehydration failed for store "${store.$id}": ${result.error}`);
          return false;
        }

        rehydrating = true;
        try {
          store.$patch(result.envelope.state);
          return true;
        } finally {
          rehydrating = false;
        }
      };

      const ready = rehydrate().then(() => undefined);
      const handleFlushError = (error: unknown) => {
        if (persist.onError) {
          persist.onError(error);
        } else {
          reportStatelyInspectorNotice(`Flush failed for store "${store.$id}": ${String(error)}`);
          console.error(`[Stately] Persistence flush failed for store "${store.$id}":`, error);
        }
      };

      const unsubscribe = store.$subscribe(() => {
        const doFlush = () => {
          debounceTimer = undefined;
          void flush().catch(handleFlushError);
        };

        if (persist.debounce) {
          cancelDebouncedFlush();
          debounceTimer = setTimeout(doFlush, persist.debounce);
        } else {
          doFlush();
        }
      });

      const dispose = store.$dispose.bind(store);
      Object.defineProperty(store, '$dispose', {
        value() {
          cancelDebouncedFlush();
          unsubscribe();
          dispose();
        },
        enumerable: false,
        configurable: true,
        writable: true
      });

      return {
        $persist: {
          ready,
          flush,
          rehydrate,
          async clear() {
            cancelDebouncedFlush();
            const wasPaused = paused;
            paused = true;
            await flushQueue.catch(() => undefined);
            await persist.adapter.removeItem(key);
            flushQueue = Promise.resolve();
            paused = wasPaused;
          },
          pause() {
            paused = true;
          },
          resume() {
            paused = false;
          }
        } satisfies PersistController
      } satisfies PersistencePluginAugmentation;
    }
  );
}
