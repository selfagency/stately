import type { StateManagerPlugin } from '../root/types.js';
import type { StoreCustomProperties } from '../pinia-like/store-types.js';
import { trackAsyncAction, type AsyncActionState, type TrackAsyncActionOptions } from './track-async-action.svelte.js';

export interface AsyncActionRegistry {
	[actionName: string]: AsyncActionState;
}

export interface AsyncPluginOptions extends TrackAsyncActionOptions {
	include?: string[];
}

declare module '../pinia-like/store-types.js' {
	interface StoreCustomProperties {
		$async: AsyncActionRegistry;
	}
}

function isAsyncTrackableStore(value: unknown): value is StoreCustomProperties & Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function createAsyncPlugin(options: AsyncPluginOptions = {}): StateManagerPlugin {
	return ({ store }) => {
		if (!isAsyncTrackableStore(store)) {
			return;
		}

		const registry: AsyncActionRegistry = {};
		for (const key of Object.keys(store)) {
			if (String(key).startsWith('$')) {
				continue;
			}

			if (options.include && !options.include.includes(key)) {
				continue;
			}

			const value = store[key];
			if (typeof value !== 'function') {
				continue;
			}

			const tracked = trackAsyncAction(value.bind(store), options);
			registry[key] = tracked.state;
			store[key] = tracked.run;
		}

		return {
			$async: registry
		};
	};
}
