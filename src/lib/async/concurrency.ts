export type ConcurrencyMode = 'parallel' | 'restartable' | 'drop' | 'enqueue' | 'dedupe';

export interface ConcurrencyOptions<Args extends unknown[]> {
	cancelActive?: () => void;
	key?: (...args: Args) => string;
}

export function createConcurrencyController<Args extends unknown[], Result>(
	mode: ConcurrencyMode,
	runner: (...args: Args) => Promise<Result>,
	options: ConcurrencyOptions<Args> = {}
) {
	let activeCount = 0;
	let queue = Promise.resolve();
	const activeByKey = new Map<string, Promise<Result>>();

	const start = (...args: Args): Promise<Result> => {
		activeCount += 1;
		const execution = Promise.resolve(runner(...args)).finally(() => {
			activeCount -= 1;
		});
		return execution;
	};

	return {
		run(...args: Args): Promise<Result | undefined> {
			switch (mode) {
				case 'parallel':
					return start(...args);
				case 'restartable':
					if (activeCount > 0) {
						options.cancelActive?.();
					}
					return start(...args);
				case 'drop':
					if (activeCount > 0) {
						return Promise.resolve(undefined);
					}
					return start(...args);
				case 'enqueue': {
					const next = queue.then(() => start(...args));
					queue = next.then(
						() => undefined,
						() => undefined
					);
					return next;
				}
				case 'dedupe': {
					let key: string;
					try {
						key = options.key?.(...args) ?? JSON.stringify(args);
					} catch {
						key = `__dedupe_unstringifiable_${Math.random()}`;
					}
					const existing = activeByKey.get(key);
					if (existing) {
						return existing;
					}
					const execution = start(...args);
					activeByKey.set(key, execution);
					execution.finally(() => activeByKey.delete(key));
					return execution;
				}
			}
		}
	};
}
