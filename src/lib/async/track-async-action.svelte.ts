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

export function trackAsyncAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
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
  let activeRequestCount = 0;
  const concurrency = createConcurrencyController(
    options.policy ?? 'parallel',
    (...args: Args) => {
      const request = requestController.begin();
      activeRequestCount += 1;
      metadata.isLoading = true;
      metadata.error = undefined;
      const actionArgs = (options.injectSignal ? options.injectSignal(request.signal, args) : args) as Args;

      return action(...actionArgs)
        .then((value) => {
          if (requestController.isCurrent(request.token)) {
            metadata.lastSuccessAt = createTimestamp();
            metadata.error = undefined;
          }
          return value;
        })
        .catch((error) => {
          if (requestController.isCurrent(request.token)) {
            metadata.error = error;
            metadata.lastFailureAt = createTimestamp();
          }
          throw error;
        })
        .finally(() => {
          activeRequestCount -= 1;
          if (activeRequestCount === 0) {
            metadata.isLoading = false;
          }
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

  const run = (...args: Args) => concurrency.run(...args);

  return {
    run,
    state
  };
}
