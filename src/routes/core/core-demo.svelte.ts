import { createStateManager, defineStore, storeToRefs } from '../../lib/index.js';

// ---------------------------------------------------------------------------
// Option store — counter with state, getters, and actions
// ---------------------------------------------------------------------------

const _useOptionCounterStore = defineStore('core-option-counter', {
	state: () => ({ count: 0 }),
	getters: {
		doubled(state) {
			return state.count * 2;
		}
	},
	actions: {
		increment() {
			this.count += 1;
		},
		decrement() {
			this.count -= 1;
		}
	}
});

// ---------------------------------------------------------------------------
// Setup store — counter using the setup factory form
// ---------------------------------------------------------------------------

const _useSetupCounterStore = defineStore('core-setup-counter', {
	setup: () => ({
		count: 0,
		get doubled() {
			return this.count * 2;
		},
		increment() {
			this.count += 1;
		},
		decrement() {
			this.count -= 1;
		}
	})
});

export function createCoreDemo() {
	const manager = createStateManager();

	const optionStore = _useOptionCounterStore(manager);
	const setupStore = _useSetupCounterStore(manager);
	const refs = storeToRefs(optionStore);

	let subscriptionLog = $state('(no mutations yet)');
	let subscriptionCount = $state(0);
	let guardActive = $state(false);

	// $subscribe: track mutations to the option store
	optionStore.$subscribe((_mutation, state) => {
		subscriptionCount += 1;
		subscriptionLog = `mutation #${subscriptionCount}: count → ${state.count}`;
	});

	// $onAction with before() guard: block increment when guard is active
	optionStore.$onAction(({ name, before }) => {
		if (name === 'increment') {
			before(() => (guardActive ? false : undefined));
		}
	});

	return {
		optionStore,
		setupStore,
		refs,
		get subscriptionLog() {
			return subscriptionLog;
		},
		get guardActive() {
			return guardActive;
		},
		setGuardActive(value: boolean) {
			guardActive = value;
		},
		destroy() {
			optionStore.$dispose();
			setupStore.$dispose();
		}
	};
}
