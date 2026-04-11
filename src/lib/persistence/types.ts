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

export interface PersistOptions<State = Record<string, unknown>> extends PersistDeserializeOptions<State> {
	adapter: PersistenceAdapter;
	key?: string;
	serialize?: (envelope: PersistEnvelope<State>) => string;
	deserialize?: (raw: string) => PersistEnvelope<Record<string, unknown>> | undefined;
}

export interface PersistController {
	readonly ready: Promise<void>;
	flush(): Promise<void>;
	rehydrate(): Promise<boolean>;
	clear(): Promise<void>;
	pause(): void;
	resume(): void;
}
