import type { PersistOptions } from '../persistence/types.js';
import type { StoreState } from './store-types.js';

export interface HistoryStoreOptions {
	limit?: number;
}

export type PersistStoreOptions<State extends object = Record<string, unknown>> = PersistOptions<State>;

type PersistableState<State extends StoreState> = State;

declare module './store-types.js' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface DefineStoreOptionsBase<State extends StoreState = StoreState, Store = unknown> {
		persist?: PersistStoreOptions<PersistableState<State>>;
		history?: HistoryStoreOptions;
	}
}
