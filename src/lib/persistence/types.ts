export type MaybePromise<T> = T | Promise<T>;

export interface PersistenceAdapter {
	getItem(key: string): MaybePromise<string | null>;
	setItem(key: string, value: string): MaybePromise<void>;
	removeItem(key: string): MaybePromise<void>;
	clear?(): MaybePromise<void>;
	keys?(): MaybePromise<string[]>;
}

export interface PersistEnvelope<State = Record<string, unknown>> {
	version: number;
	state: State;
}

export interface PersistDeserializeOptions<State> {
	version: number;
	migrate?: (state: Record<string, unknown>, fromVersion: number) => State;
}

type PersistSelectionOptions<State> =
	| {
			/** Persist only these keys from the state. Cannot be used together with `omit`. */
			pick?: (keyof State)[];
			omit?: never;
	  }
	| {
			pick?: never;
			/** Exclude these keys from persistence. Cannot be used together with `pick`. */
			omit?: (keyof State)[];
	  };

export interface PersistCompression {
	compress(value: string): string;
	decompress(value: string): string | undefined;
}

export type PersistOptions<State = Record<string, unknown>> = PersistDeserializeOptions<State> &
	PersistSelectionOptions<State> & {
		adapter: PersistenceAdapter;
		key?: string;
		compression?: PersistCompression;
		serialize?: (envelope: PersistEnvelope<State>) => string;
		deserialize?: (raw: string) => PersistEnvelope<Record<string, unknown>> | undefined;
		/** Called when an auto-flush write to the adapter fails. If omitted, a notice is emitted to the Stately inspector. */
		onError?: (error: unknown) => void;
		/** Debounce auto-flush writes by this many milliseconds (trailing edge). Useful for high-frequency mutations. */
		debounce?: number;
		/** Time-to-live in milliseconds. Persisted state older than this is discarded on rehydration. */
		ttl?: number;
	};

export interface PersistController {
	readonly ready: Promise<void>;
	flush(): Promise<void>;
	rehydrate(): Promise<boolean>;
	clear(): Promise<void>;
	pause(): void;
	resume(): void;
}
