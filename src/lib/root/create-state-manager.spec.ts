import { describe, expect, it } from 'vitest';
import { createStateManager } from './create-state-manager.js';

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
});
