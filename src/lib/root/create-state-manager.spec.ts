import { describe, expect, it, vi } from 'vitest';
import { createStateManager, getDefaultStateManager } from './create-state-manager.js';

interface ExampleDefinition {
	$id: string;
	options?: { value: number };
}

describe('createStateManager', () => {
	it('creates isolated managers with independent plugin and store registries', () => {
		const first = createStateManager();
		const second = createStateManager();

		const plugin = () => ({ pluginApplied: true });
		first.use(plugin);

		const definition: ExampleDefinition = {
			$id: 'counter',
			options: { value: 1 }
		};

		first.register(definition);
		const store = first.createStore(definition, () => ({ count: definition.options?.value ?? 0 }));

		expect(first.plugins).toHaveLength(1);
		expect(second.plugins).toHaveLength(0);
		expect(first.hasDefinition('counter')).toBe(true);
		expect(second.hasDefinition('counter')).toBe(false);
		expect(first.getStore<{ count: number }>('counter')).toEqual({ count: 1, pluginApplied: true });
		expect(second.getStore('counter')).toBeUndefined();
		expect(store).toBe(first.getStore('counter'));
	});

	it('rejects duplicate store definitions in the same manager', () => {
		const manager = createStateManager();
		const definition: ExampleDefinition = { $id: 'duplicate' };

		manager.register(definition);

		expect(() => manager.register(definition)).toThrow(/duplicate/i);
	});

	it('rejects duplicate definitions through createStore when a different definition uses the same id', () => {
		const manager = createStateManager();
		const defA: ExampleDefinition = { $id: 'conflict' };
		const defB: ExampleDefinition = { $id: 'conflict' };

		manager.createStore(defA, () => ({ value: 1 }));
		expect(() => manager.createStore(defB, () => ({ value: 2 }))).toThrow(/duplicate/i);
	});

	it('throws when getDefaultStateManager is called without a window global', () => {
		const original = globalThis.window;
		vi.stubGlobal('window', undefined);
		try {
			expect(() => getDefaultStateManager()).toThrow(/SSR/);
		} finally {
			vi.stubGlobal('window', original);
		}
	});

	it('preserves plugin getter descriptors when applying augmentations', () => {
		const manager = createStateManager().use(() => {
			let counter = 0;
			return {
				get reactiveValue() {
					counter += 1;
					return counter;
				}
			};
		});

		const definition: ExampleDefinition = { $id: 'descriptor-store' };
		const store = manager.createStore(definition, () => ({}) as Record<string, unknown>) as Record<string, unknown>;

		expect(Reflect.get(store, 'reactiveValue')).toBe(1);
		expect(Reflect.get(store, 'reactiveValue')).toBe(2);
	});

	it('disposes stores before deleting them from the manager', () => {
		const manager = createStateManager();
		const definition: ExampleDefinition = { $id: 'disposable-store' };
		const dispose = vi.fn();

		manager.createStore(definition, () => ({ $dispose: dispose }));

		expect(manager.deleteStore('disposable-store')).toBe(true);
		expect(dispose).toHaveBeenCalledTimes(1);
		expect(manager.hasStore('disposable-store')).toBe(false);
		expect(manager.hasDefinition('disposable-store')).toBe(false);
	});
});
