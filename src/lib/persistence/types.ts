export type MaybePromise<T> = T | Promise<T>;

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [Key in string]: JsonValue };
export type JsonArray = JsonValue[] | readonly JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface PersistenceAdapter {
	getItem(key: string): MaybePromise<string | null>;
	setItem(key: string, value: string): MaybePromise<void>;
	removeItem(key: string): MaybePromise<void>;
	clear?(): MaybePromise<void>;
	keys?(): MaybePromise<string[]>;
}

export interface PersistEnvelope<State extends object = object> {
	version: number;
	state: State;
}

export interface PersistDeserializeOptions<State extends object> {
	version: number;
	migrate?: (state: JsonObject, fromVersion: number) => State;
}

type PersistSelectionOptions<State extends object> =
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

export type PersistOptions<State extends object = object> = PersistDeserializeOptions<State> &
	PersistSelectionOptions<State> & {
		adapter: PersistenceAdapter;
		key?: string;
		compression?: PersistCompression;
		serialize?: (envelope: PersistEnvelope<State>) => string;
		deserialize?: (raw: string) => PersistEnvelope<State> | undefined;
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
