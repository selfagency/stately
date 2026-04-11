export interface AsyncActionState {
	isLoading: boolean;
	error: unknown;
	lastSuccessAt?: number;
	lastFailureAt?: number;
	abort(): void;
}

export interface TrackAsyncActionOptions {
	createTimestamp?: () => number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackAsyncAction<Action extends (...args: any[]) => unknown>(
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

	const run = ((...args: Parameters<Action>) => {
		const result = action(...args);
		if (!(result instanceof Promise)) {
			return result;
		}

		activeController = new AbortController();
		metadata.isLoading = true;
		metadata.error = undefined;

		return result
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
	}) as Action;

	return {
		run,
		state
	};
}
