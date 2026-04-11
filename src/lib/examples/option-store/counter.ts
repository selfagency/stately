import { defineStore } from '../../index.js';

export const useCounterStore = defineStore('example-option-counter', {
	state: () => ({ count: 0, step: 1 }),
	getters: {
		doubleCount(state) {
			return state.count * 2;
		}
	},
	actions: {
		increment() {
			this.count += this.step;
		},
		setStep(step: number) {
			this.step = step;
		}
	}
});
