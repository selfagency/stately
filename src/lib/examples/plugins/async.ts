import { createAsyncPlugin, createStateManager, defineStore } from '../../index.js';

export const useAsyncCounterStore = defineStore('example-plugin-async', {
	state: () => ({ count: 0 }),
	actions: {
		async loadCount(signal: AbortSignal, target: number) {
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(resolve, 250);
				signal.addEventListener(
					'abort',
					() => {
						clearTimeout(timeout);
						reject(new DOMException('Aborted', 'AbortError'));
					},
					{ once: true }
				);
			});

			this.count = target;
			return target;
		}
	}
});

export const asyncManager = createStateManager().use(
	createAsyncPlugin({
		include: ['loadCount'],
		policies: { loadCount: 'restartable' },
		injectSignal(signal, args) {
			return [signal, ...args];
		}
	})
);
