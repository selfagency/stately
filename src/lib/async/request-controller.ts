export interface RequestHandle {
	token: number;
	controller: AbortController;
	signal: AbortSignal;
}

export function createRequestController() {
	let current: RequestHandle | undefined;
	let nextToken = 1;

	return {
		begin(options: { abortActive?: boolean } = {}): RequestHandle {
			if (options.abortActive) {
				current?.controller.abort();
			}

			const controller = new AbortController();
			const handle = {
				token: nextToken++,
				controller,
				signal: controller.signal
			};
			current = handle;
			return handle;
		},
		abort(reason?: unknown) {
			current?.controller.abort(reason);
		},
		isCurrent(token: number): boolean {
			return current?.token === token;
		},
		clear(token: number): void {
			if (current?.token === token) {
				current = undefined;
			}
		}
	};
}
