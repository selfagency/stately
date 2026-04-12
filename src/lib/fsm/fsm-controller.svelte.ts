import type { FsmController, FsmDefinition, FsmStateDefinition, FsmTransitionContext } from './types.js';

const RESERVED_KEYS = new Set(['_enter', '_exit']);

export interface InternalFsmController extends FsmController {
	setCurrent(state: string): void;
}

export function createFsmController(definition: FsmDefinition): InternalFsmController {
	if (!(definition.initial in definition.states)) {
		throw new Error(`Invalid FSM definition: initial state "${definition.initial}" is not defined in states.`);
	}

	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- FSM definitions are static after initialization.
	const statesMap = new Map<string, FsmStateDefinition>(Object.entries(definition.states));
	let current = $state(definition.initial);

	function resolveTransition(event: string, ...args: unknown[]): string | undefined {
		const stateDefinition = statesMap.get(current);
		if (!stateDefinition) {
			return undefined;
		}

		const target = stateDefinition[event];
		if (target === undefined || RESERVED_KEYS.has(event)) {
			return undefined;
		}

		if (typeof target === 'string') {
			return target;
		}

		if (typeof target === 'function') {
			const result = (target as (...a: unknown[]) => string | void)(...args);
			return typeof result === 'string' ? result : undefined;
		}

		return undefined;
	}

	return {
		get current() {
			return current;
		},

		send(event: string, ...args: unknown[]): string {
			const nextState = resolveTransition(event, ...args);
			if (nextState === undefined || !statesMap.has(nextState)) {
				return current;
			}

			const from = current;
			const context: FsmTransitionContext = {
				from,
				to: nextState,
				event,
				args
			};

			const exitHook = statesMap.get(from)?._exit;
			if (typeof exitHook === 'function') {
				exitHook(context);
			}

			current = nextState;

			const enterHook = statesMap.get(nextState)?._enter;
			if (typeof enterHook === 'function') {
				enterHook(context);
			}

			return current;
		},

		matches(...states: string[]): boolean {
			return states.includes(current);
		},

		can(event: string): boolean {
			return resolveTransition(event) !== undefined;
		},

		setCurrent(state: string): void {
			if (statesMap.has(state)) {
				current = state;
			}
		}
	};
}
