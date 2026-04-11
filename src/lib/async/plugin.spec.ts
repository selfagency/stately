import { describe, expect, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createAsyncPlugin } from './plugin.svelte.js';

describe('createAsyncPlugin', () => {
	it('adds per-action async state and preserves action hook semantics', async () => {
		let tick = 1000;
		const events: string[] = [];
		const manager = createStateManager().use(createAsyncPlugin({ createTimestamp: () => ++tick }));
		const useStore = defineStore('async-plugin-store', {
			state: () => ({ count: 0 }),
			actions: {
				async load(amount: number) {
					this.count += amount;
					return this.count;
				},
				async fail() {
					throw new Error('nope');
				}
			}
		});
		const store = useStore(manager);

		store.$onAction(({ name, after, onError }) => {
			events.push(`start:${name}`);
			after((result) => events.push(`after:${String(result)}`));
			onError((error) => events.push(`error:${String(error)}`));
		});

		const pending = store.load(2);
		expect(store.$async.load.isLoading).toBe(true);
		await expect(pending).resolves.toBe(2);
		expect(store.$async.load.isLoading).toBe(false);
		expect(store.$async.load.lastSuccessAt).toBe(1001);

		await expect(store.fail()).rejects.toThrow('nope');
		expect(store.$async.fail.lastFailureAt).toBe(1002);
		expect(events).toEqual([
			'start:load',
			'after:2',
			'start:fail',
			'error:Error: nope'
		]);
	});
});
