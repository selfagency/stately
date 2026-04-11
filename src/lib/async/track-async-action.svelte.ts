import { createConcurrencyController, type ConcurrencyMode } from './concurrency.js';
import { createRequestController } from './request-controller.js';

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
	injectSignal?: (signal: AbortSignal, args: unknown[]) => unknown[];
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
	const createTimestamp = options.createTimestamp ?? (() => Date.now());
	const requestController = createRequestController();
	const concurrency = createConcurrencyController(
		options.policy ?? 'parallel',
		(...args: Parameters<Action>) => {
			const request = requestController.begin();
			metadata.isLoading = true;
			metadata.error = undefined;
			const actionArgs = (options.injectSignal
				? options.injectSignal(request.signal, args)
				: args) as Parameters<Action>;

			return action(...actionArgs)
				.then((value) => {
					if (requestController.isCurrent(request.token)) {
						metadata.isLoading = false;
						metadata.lastSuccessAt = createTimestamp();
						metadata.error = undefined;
					}
					return value;
				})
				.catch((error) => {
					if (requestController.isCurrent(request.token)) {
						metadata.isLoading = false;
						metadata.error = error;
						metadata.lastFailureAt = createTimestamp();
					}
					throw error;
				})
				.finally(() => {
					requestController.clear(request.token);
				});
		},
		{ cancelActive: () => requestController.abort() }
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
			requestController.abort();
		}
	};

	const run = ((...args: Parameters<Action>) => concurrency.run(...args)) as Action;

	return {
		run,
		state
	};
}
