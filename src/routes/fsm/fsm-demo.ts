import { createFsmPlugin, createStateManager, defineStore } from '../../lib/index.js';
import type { FsmController } from '../../lib/fsm/types.js';

// ---------------------------------------------------------------------------
// Traffic-light FSM — simplest possible state machine demo
// ---------------------------------------------------------------------------

const _useTrafficStore = defineStore('fsm-traffic', {
	state: () => ({ count: 0 }),
	fsm: {
		initial: 'red',
		states: {
			red: { NEXT: 'green' },
			green: { NEXT: 'yellow' },
			yellow: { NEXT: 'red' }
		}
	}
} as {
	state: () => { count: number };
	fsm: { initial: string; states: Record<string, Record<string, string>> };
});

// ---------------------------------------------------------------------------
// Order workflow FSM — richer lifecycle demo
// ---------------------------------------------------------------------------

const _useOrderStore = defineStore('fsm-order', {
	state: () => ({
		orderId: '',
		items: [] as string[],
		error: ''
	}),
	fsm: {
		initial: 'idle',
		states: {
			idle: {
				START: 'draft'
			},
			draft: {
				SUBMIT: 'pending',
				CANCEL: 'idle'
			},
			pending: {
				APPROVE: 'fulfilled',
				REJECT: 'rejected'
			},
			fulfilled: {
				RESET: 'idle'
			},
			rejected: {
				RETRY: 'draft',
				RESET: 'idle'
			}
		}
	}
} as {
	state: () => { orderId: string; items: string[]; error: string };
	fsm: { initial: string; states: Record<string, Record<string, string>> };
});

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------

export type TrafficStore = ReturnType<typeof _useTrafficStore> & {
	$fsm: FsmController;
};

export type OrderStore = ReturnType<typeof _useOrderStore> & {
	$fsm: FsmController;
};

export interface FsmDemo {
	trafficStore: TrafficStore;
	orderStore: OrderStore;
	trafficColor: string;
	destroy(): void;
}

export function createFsmDemo(): FsmDemo {
	const trafficManager = createStateManager().use(createFsmPlugin());
	const orderManager = createStateManager().use(createFsmPlugin());

	const trafficStore = _useTrafficStore(trafficManager) as TrafficStore;
	const orderStore = _useOrderStore(orderManager) as OrderStore;

	const colorMap: Record<string, string> = {
		red: '#ef4444',
		yellow: '#eab308',
		green: '#22c55e'
	};

	return {
		trafficStore,
		orderStore,
		get trafficColor() {
			return colorMap[trafficStore.$fsm.current] ?? '#e5e7eb';
		},
		destroy() {
			trafficStore.$dispose();
			orderStore.$dispose();
		}
	};
}
