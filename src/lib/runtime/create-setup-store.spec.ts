import { describe, expect, it } from 'vitest';
import { createSetupStore } from './create-setup-store.svelte.js';

describe('createSetupStore', () => {
	it('classifies returned members into live state, getters, and bound actions', () => {
		let hiddenCount = 100;
		const counter = createSetupStore('counter', () => {
			const store = {
				count: 0,
				label: 'Counter',
				get doubleCount() {
					return this.count * 2;
				},
				increment() {
					this.count += 1;
				},
				readHidden() {
					return hiddenCount;
				}
			};

			hiddenCount += 1;
			return store;
		});

		expect(counter.$id).toBe('counter');
		expect(counter.count).toBe(0);
		expect(counter.doubleCount).toBe(0);
		expect(counter.readHidden()).toBe(101);

		counter.increment();
		counter.count += 2;
		counter.label = 'Updated';

		expect(counter.count).toBe(3);
		expect(counter.doubleCount).toBe(6);
		expect(counter.label).toBe('Updated');
	});
});
