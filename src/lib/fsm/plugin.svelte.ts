import type { StoreCustomProperties, StoreMutationContext } from '../pinia-like/store-types.js';
import type { StateManagerPlugin } from '../root/types.js';
import { createFsmController } from './fsm-controller.svelte.js';
import type { FsmController, FsmDefinition } from './types.js';

interface FsmStore<State = Record<string, unknown>> {
	readonly $id: string;
	$state: State;
	$patch(patch: Partial<State> | ((state: State) => void)): void;
	$subscribe(callback: (mutation: StoreMutationContext, state: State) => void): () => void;
}

declare module '../pinia-like/store-types.js' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface DefineStoreOptionsBase<State, Store> {
		fsm?: FsmDefinition;
	}

	interface StoreCustomProperties {
		$fsm: FsmController;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isFsmStore(value: unknown): value is FsmStore {
	return isRecord(value) && '$state' in value && '$patch' in value && '$subscribe' in value;
}

function readFsmOptions(value: unknown): FsmDefinition | undefined {
	if (!isRecord(value) || !('fsm' in value)) {
		return undefined;
	}

	const fsm = value.fsm;
	if (!isRecord(fsm) || typeof fsm.initial !== 'string' || !isRecord(fsm.states)) {
		return undefined;
	}

	return fsm as unknown as FsmDefinition;
}

const FSM_STATE_KEY = '__stately_fsm';

export function createFsmPlugin(): StateManagerPlugin {
	return ({ options, store }) => {
		if (!isFsmStore(store)) {
			return;
		}

		const definition = readFsmOptions(options);
		if (!definition) {
			return;
		}

		const controller = createFsmController(definition);

		const originalSend = controller.send.bind(controller);
		const patchingSend = (event: string, ...args: unknown[]): string => {
			const prev = controller.current;
			const next = originalSend(event, ...args);
			if (next !== prev) {
				store.$patch((state: Record<string, unknown>) => {
					state[FSM_STATE_KEY] = next;
				});
			}
			return next;
		};

		store.$subscribe((mutation: StoreMutationContext, state: Record<string, unknown>) => {
			const persisted = state[FSM_STATE_KEY];
			if (typeof persisted === 'string' && persisted !== controller.current && persisted in definition.states) {
				controller.setCurrent(persisted);
			}
		});

		// Store the initial FSM state in store state for history tracking
		(store.$state as Record<string, unknown>)[FSM_STATE_KEY] = controller.current;

		return {
			$fsm: {
				get current() {
					return controller.current;
				},
				send: patchingSend,
				matches: controller.matches.bind(controller),
				can: controller.can.bind(controller)
			}
		} as Partial<StoreCustomProperties>;
	};
}
