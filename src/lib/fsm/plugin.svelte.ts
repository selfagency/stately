import type { StoreCustomProperties, StoreMutationContext, StoreState } from '../pinia-like/store-types.js';
import type { StateManagerPlugin, StoreDefinition } from '../root/types.js';
import { createFsmController } from './fsm-controller.svelte.js';
import type { FsmController, FsmDefinition, FsmStateDefinition } from './types.js';

interface FsmStore<State extends object = StoreState> {
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface StoreCustomProperties<State extends StoreState = StoreState, Store extends object = object> {
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

	return {
		initial: fsm.initial,
		states: fsm.states as Record<string, FsmStateDefinition>
	};
}

const FSM_STATE_KEY = '__stately_fsm';
type FsmPatchedState<State extends object> = State & { [FSM_STATE_KEY]?: string };

type FsmPluginAugmentation = Pick<StoreCustomProperties, '$fsm'>;

export function createFsmPlugin(): StateManagerPlugin<StoreDefinition, FsmStore, FsmPluginAugmentation> {
	return ({ options, store }) => {
		if (!isFsmStore(store)) {
			return;
		}

		const definition = readFsmOptions(options);
		if (!definition) {
			return;
		}

		const controller = createFsmController(definition);

		// Initialize FSM state in store state through $patch so history/persistence/sync observe it
		store.$patch((state: FsmPatchedState<typeof store.$state>) => {
			state[FSM_STATE_KEY] = controller.current;
		});

		const originalSend = controller.send.bind(controller);
		const patchingSend = (event: string, ...args: unknown[]): string => {
			const prev = controller.current;
			const next = originalSend(event, ...args);
			if (next !== prev) {
				store.$patch((state: FsmPatchedState<typeof store.$state>) => {
					state[FSM_STATE_KEY] = next;
				});
			}
			return next;
		};

		store.$subscribe((mutation: StoreMutationContext, state: FsmPatchedState<typeof store.$state>) => {
			const persisted = state[FSM_STATE_KEY];
			if (typeof persisted === 'string' && persisted !== controller.current && persisted in definition.states) {
				controller.setCurrent(persisted);
			}
		});

		return {
			$fsm: {
				get current() {
					return controller.current;
				},
				send: patchingSend,
				matches: controller.matches.bind(controller),
				can: controller.can.bind(controller)
			}
		} satisfies FsmPluginAugmentation;
	};
}
