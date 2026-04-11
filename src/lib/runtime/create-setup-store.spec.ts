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

	it('supports writable accessor properties in setup stores', () => {
		let value = 5;
		const store = createSetupStore('accessor-store', () => {
			return Object.defineProperties(
				{},
				{
					value: {
						enumerable: true,
						configurable: true,
						get() {
							return value;
						},
						set(nextValue: number) {
							value = nextValue;
						}
					}
				}
			) as { value: number };
		});

		expect(store.value).toBe(5);
		store.value = 9;
		expect(store.value).toBe(9);
		expect(value).toBe(5);
	});

	it('supports class-based setup stores with prototype getters and actions', () => {
		type CounterStoreShape = Record<string, unknown> & {
			count: number;
			readonly doubleCount: number;
			increment(): void;
		};

		class CounterStore {
			count = 0;

			get doubleCount() {
				return this.count * 2;
			}

			increment() {
				this.count += 1;
			}
		}

		const counter = createSetupStore('class-counter', () => new CounterStore() as CounterStoreShape);

		expect(counter.count).toBe(0);
		expect(counter.doubleCount).toBe(0);

		counter.increment();

		expect(counter.count).toBe(1);
		expect(counter.doubleCount).toBe(2);
	});
});
