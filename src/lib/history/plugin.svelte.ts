import type { StoreCustomProperties } from '../pinia-like/store-types.js';
import type { StateManagerPlugin } from '../root/types.js';
import { createHistoryController, type HistoryController } from './history-controller.svelte.js';

interface HistoryStore<State = Record<string, unknown>> {
	readonly $id: string;
	$state: State;
	$patch(patch: Partial<State> | ((state: State) => void)): void;
	$subscribe(callback: () => void): () => void;
}

interface HistoryOptions {
	limit?: number;
}

declare module '../pinia-like/store-types.js' {
	interface StoreCustomProperties {
		$history: HistoryController<Record<string, unknown>>;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isHistoryStore(value: unknown): value is HistoryStore<Record<string, unknown>> {
	return isRecord(value) && '$state' in value && '$patch' in value && '$subscribe' in value;
}

function readHistoryOptions(value: unknown): HistoryOptions | undefined {
	if (!isRecord(value) || !('history' in value) || !isRecord(value.history)) {
		return undefined;
	}

	return value.history as HistoryOptions;
}

function snapshotOf(store: HistoryStore<Record<string, unknown>>) {
	return $state.snapshot(store.$state) as Record<string, unknown>;
}

export function createHistoryPlugin(): StateManagerPlugin {
	return ({ options, store }) => {
		if (!isHistoryStore(store)) {
			return;
		}

		const historyOptions = readHistoryOptions(options);
		if (!historyOptions) {
			return;
		}

		const controller = createHistoryController({
			initialSnapshot: snapshotOf(store),
			limit: historyOptions.limit,
			applySnapshot(snapshot) {
				store.$patch(snapshot);
			}
		});

		store.$subscribe(() => {
			if (controller.isReplaying) {
				return;
			}
			controller.record(snapshotOf(store));
		});

		return {
			$history: controller
		} satisfies Partial<StoreCustomProperties>;
	};
}
