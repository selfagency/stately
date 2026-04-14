import { readMarker } from '../internal/marker-helpers.js';
import type { StoreCustomProperties } from '../pinia-like/store-types.js';
import { defineStateManagerPlugin, type StateManagerPlugin, type StoreDefinition } from '../root/types.js';
import { ASYNC_ACTION_MARKER } from '../runtime/async-marker.js';
import type { ConcurrencyMode } from './concurrency.js';
import { trackAsyncAction, type AsyncActionState, type TrackAsyncActionOptions } from './track-async-action.svelte.js';

export interface AsyncActionRegistry {
  [actionName: string]: AsyncActionState;
}

export interface AsyncPluginOptions extends TrackAsyncActionOptions {
  include?: string[];
  policies?: Record<string, ConcurrencyMode>;
}

declare module '../pinia-like/store-types.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreCustomProperties<State extends StoreState = StoreState, Store extends object = object> {
    $async: AsyncActionRegistry;
  }
}

type AsyncPluginAugmentation = Pick<StoreCustomProperties, '$async'>;

export function createAsyncPlugin(
  options: AsyncPluginOptions = {}
): StateManagerPlugin<StoreDefinition, StoreCustomProperties & Record<string, unknown>, AsyncPluginAugmentation> {
  return defineStateManagerPlugin<
    StoreDefinition,
    StoreCustomProperties & Record<string, unknown>,
    AsyncPluginAugmentation
  >(({ store }) => {
    const registry: AsyncActionRegistry = {};
    for (const key of Object.keys(store)) {
      if (String(key).startsWith('$')) {
        continue;
      }

      const isExplicitlyIncluded = options.include?.includes(key) ?? false;

      if (options.include && !isExplicitlyIncluded) {
        continue;
      }

      const value = store[key];
      if (typeof value !== 'function') {
        continue;
      }

      // By default we only wrap actions that were originally declared async.
      // `include` also acts as an explicit opt-in for Promise-returning actions declared without `async`.
      if (!isExplicitlyIncluded && !readMarker<boolean>(value, ASYNC_ACTION_MARKER)) {
        continue;
      }

      const invoke = (...args: unknown[]) => {
        try {
          return Promise.resolve(value.apply(store, args));
        } catch (error) {
          return Promise.reject(error);
        }
      };

      const tracked = trackAsyncAction(invoke, {
        createTimestamp: options.createTimestamp,
        policy: options.policies?.[key] ?? options.policy,
        injectSignal: options.injectSignal
      });
      registry[key] = tracked.state;
      store[key] = tracked.run;
    }

    return {
      $async: registry
    };
  });
}
