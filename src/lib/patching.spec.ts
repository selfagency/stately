import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

describe('patching flows', () => {
	it('groups patch-function mutations into one logical commit and preserves direct mutation metadata', () => {
		const manager = createStateManager();
		const useStore = defineStore('patching-runtime', {
			state: () => ({ count: 0 }),
			actions: {
				increment() {
					this.count += 1;
				}
			}
		});
		const store = useStore(manager);
		const mutations: Array<{ type: string; mutationCount: number }> = [];

		store.$subscribe((mutation) => {
			const payload = mutation.payload as { commit?: { mutationCount?: number } } | undefined;
			mutations.push({
				type: mutation.type,
				mutationCount: payload?.commit?.mutationCount ?? 0
			});
		});

		store.count += 1;
		store.$patch({ count: 3 });
		store.$patch((state) => {
			state.count += 2;
			state.count += 1;
		});
		store.increment();

		expect(store.count).toBe(7);
		expect(mutations).toEqual([
			{ type: 'direct', mutationCount: 1 },
			{ type: 'patch-object', mutationCount: 1 },
			{ type: 'patch-function', mutationCount: 1 },
			{ type: 'direct', mutationCount: 1 }
		]);
	});
});
