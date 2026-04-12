import type { StateManagerPlugin } from '../root/types.js';

interface ValidatableStore<State = Record<string, unknown>> {
	readonly $id: string;
	$state: State;
	$patch(patch: Partial<State> | ((state: State) => void)): void;
	$subscribe(callback: (mutation: unknown, state: State) => void, options?: { detached?: boolean }): () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isValidatableStore(value: unknown): value is ValidatableStore {
	return isRecord(value) && '$state' in value && '$patch' in value;
}

function readValidateOptions(value: unknown):
	| {
			validate: (state: Record<string, unknown>) => boolean | string;
			onValidationError?: (error: string) => void;
	  }
	| undefined {
	if (!isRecord(value) || typeof value.validate !== 'function') {
		return undefined;
	}
	return {
		validate: value.validate as (state: Record<string, unknown>) => boolean | string,
		onValidationError:
			typeof value.onValidationError === 'function' ? (value.onValidationError as (error: string) => void) : undefined
	};
}

declare module '../pinia-like/store-types.js' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface DefineStoreOptionsBase<State, Store> {
		validate?: (state: State) => boolean | string;
		onValidationError?: (error: string) => void;
	}
}

export function createValidationPlugin(): StateManagerPlugin {
	return ({ options, store }) => {
		if (!isValidatableStore(store)) {
			return;
		}

		const config = readValidateOptions(options);
		if (!config) {
			return;
		}

		const validatable = store as ValidatableStore;
		const originalPatch = validatable.$patch.bind(validatable);

		Object.defineProperty(store, '$patch', {
			enumerable: false,
			configurable: true,
			writable: true,
			value(patch: Partial<Record<string, unknown>> | ((state: Record<string, unknown>) => void)) {
				const snapshot = structuredClone($state.snapshot(validatable.$state)) as Record<string, unknown>;
				const restoreSnapshot = () => {
					validatable.$state = structuredClone(snapshot) as typeof validatable.$state;
				};

				originalPatch(patch);

				let result: boolean | string | undefined;
				try {
					result = config.validate(validatable.$state as Record<string, unknown>);
				} catch (error) {
					restoreSnapshot();
					throw error;
				}

				if (result === true || result === undefined) {
					return;
				}

				restoreSnapshot();
				const errorMessage = typeof result === 'string' ? result : 'Validation failed';
				if (config.onValidationError) {
					config.onValidationError(errorMessage);
				}
				throw new Error(errorMessage);
			}
		});
	};
}
