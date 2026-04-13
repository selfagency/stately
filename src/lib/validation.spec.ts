import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createValidationPlugin } from './validation/plugin.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

describe('validation plugin', () => {
	it('rejects $patch when validate returns false', () => {
		const manager = createStateManager().use(createValidationPlugin());
		const useStore = defineStore('val-reject', {
			state: () => ({ count: 0 }),
			validate: (state) => state.count >= 0
		});
		const store = useStore(manager);

		expect(() => store.$patch({ count: -1 })).toThrow();
		expect(store.count).toBe(0);
	});

	it('rejects $patch when validate returns an error string', () => {
		const manager = createStateManager().use(createValidationPlugin());
		const useStore = defineStore('val-string', {
			state: () => ({ name: '' }),
			validate: (state) => (state.name.length > 0 ? true : 'Name is required')
		});
		const store = useStore(manager);

		expect(() => store.$patch({ name: '' })).toThrow('Name is required');
	});

	it('allows $patch when validate returns true', () => {
		const manager = createStateManager().use(createValidationPlugin());
		const useStore = defineStore('val-allow', {
			state: () => ({ count: 0 }),
			validate: (state) => state.count >= 0
		});
		const store = useStore(manager);

		store.$patch({ count: 5 });
		expect(store.count).toBe(5);
	});

	it('calls onValidationError when validation fails', () => {
		const errorSpy = vi.fn();
		const manager = createStateManager().use(createValidationPlugin());
		const useStore = defineStore('val-callback', {
			state: () => ({ count: 0 }),
			validate: (state) => (state.count >= 0 ? true : 'Must be non-negative'),
			onValidationError: errorSpy
		});
		const store = useStore(manager);

		expect(() => store.$patch({ count: -5 })).toThrow();
		expect(errorSpy).toHaveBeenCalledWith('Must be non-negative');
	});

	it('stores without validate option are unaffected', () => {
		const manager = createStateManager().use(createValidationPlugin());
		const useStore = defineStore('val-none', {
			state: () => ({ count: 0 })
		});
		const store = useStore(manager);

		store.$patch({ count: 100 });
		expect(store.count).toBe(100);
	});

	it('preserves interface-based state types inside validate callbacks', () => {
		interface ValidationState {
			count: number;
			label: string;
		}

		const manager = createStateManager().use(createValidationPlugin());
		const useStore = defineStore('val-typed-interface', {
			state: (): ValidationState => ({ count: 0, label: 'ready' }),
			validate(state) {
				expectTypeOf(state.count).toEqualTypeOf<number>();
				expectTypeOf(state.label).toEqualTypeOf<string>();
				return state.count >= 0;
			}
		});
		const store = useStore(manager);

		store.$patch({ count: 2 });
		expect(store.label).toBe('ready');
	});
});
