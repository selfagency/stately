// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => void;

export interface CancellableAction<T extends AnyFunction> {
	(...args: Parameters<T>): void;
	cancel(): void;
}

export function debounceAction<T extends AnyFunction>(fn: T, wait: number): CancellableAction<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const debounced = (...args: Parameters<T>) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), wait);
	};
	debounced.cancel = () => clearTimeout(timer);
	return debounced as CancellableAction<T>;
}

export function throttleAction<T extends AnyFunction>(fn: T, interval: number): CancellableAction<T> {
	let lastRun = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pendingArgs: Parameters<T> | undefined;

	const throttled = (...args: Parameters<T>) => {
		const now = Date.now();
		const remaining = interval - (now - lastRun);

		if (remaining <= 0) {
			clearTimeout(timer);
			timer = undefined;
			pendingArgs = undefined;
			lastRun = now;
			fn(...args);
		} else {
			pendingArgs = args;
			if (!timer) {
				timer = setTimeout(() => {
					lastRun = Date.now();
					timer = undefined;
					if (pendingArgs) {
						fn(...pendingArgs);
						pendingArgs = undefined;
					}
				}, remaining);
			}
		}
	};
	throttled.cancel = () => {
		clearTimeout(timer);
		timer = undefined;
		pendingArgs = undefined;
	};
	return throttled as CancellableAction<T>;
}
