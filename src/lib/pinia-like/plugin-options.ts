import type { PersistOptions } from '../persistence/types.js';
import type { StoreState } from './store-types.js';

export interface HistoryStoreOptions {
  limit?: number;
}

export type PersistStoreOptions<State extends object = Record<string, unknown>> = PersistOptions<State>;

type PersistableState<State extends StoreState> = State;

declare module './store-types.js' {
  interface DefineStoreOptionsBase<_State extends object = object, _Store = unknown> {
    persist?: PersistStoreOptions<PersistableState<_State>>;
    history?: HistoryStoreOptions;
  }
}
