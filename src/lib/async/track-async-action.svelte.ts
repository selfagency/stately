import { createConcurrencyController, type ConcurrencyMode } from './concurrency.js';

export interface AsyncActionState {
	isLoading: boolean;
	error: unknown;
	lastSuccessAt?: number;
	lastFailureAt?: number;
	abort(): void;
}

export interface TrackAsyncActionOptions {
	createTimestamp?: () => number;
	policy?: ConcurrencyMode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackAsyncAction<Action extends (...args: any[]) => Promise<unknown>>(
	action: Action,
	options: TrackAsyncActionOptions = {}
) {
	const metadata = $state({
		isLoading: false,
		error: undefined as unknown,
		lastSuccessAt: undefined as number | undefined,
		lastFailureAt: undefined as number | undefined
	});
	let activeController: AbortController | undefined;
	const createTimestamp = options.createTimestamp ?? (() => Date.now());
	const concurrency = createConcurrencyController(
		options.policy ?? 'parallel',
		(...args: Parameters<Action>) => {
			activeController = new AbortController();
			metadata.isLoading = true;
			metadata.error = undefined;

			return action(...args)
				.then((value) => {
					metadata.isLoading = false;
					metadata.lastSuccessAt = createTimestamp();
					return value;
				})
				.catch((error) => {
					metadata.isLoading = false;
					metadata.error = error;
					metadata.lastFailureAt = createTimestamp();
					throw error;
				})
				.finally(() => {
					activeController = undefined;
				});
		},
		{ cancelActive: () => activeController?.abort() }
	);

	const state: AsyncActionState = {
		get isLoading() {
			return metadata.isLoading;
		},
		get error() {
			return metadata.error;
		},
		get lastSuccessAt() {
			return metadata.lastSuccessAt;
		},
		get lastFailureAt() {
			return metadata.lastFailureAt;
		},
		abort() {
			activeController?.abort();
		}
	};

	const run = ((...args: Parameters<Action>) => concurrency.run(...args)) as Action;

	return {
		run,
		state
	};
}
