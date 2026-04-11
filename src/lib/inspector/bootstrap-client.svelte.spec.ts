import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createStatelyInspectorHook, installStatelyInspectorHook, resetStatelyInspectorHookForTests } from './hook.js';
import { disposeStatelyInspector, mountStatelyInspector } from './bootstrap-client.js';

afterEach(() => {
	disposeStatelyInspector();
	resetStatelyInspectorHookForTests();
});

describe('bootstrap client', () => {
	it('mounts the inspector host, renders registered stores, and disposes cleanly', async () => {
		const hook = createStatelyInspectorHook();
		installStatelyInspectorHook(hook);

		const manager = createStateManager();
		const useStore = defineStore('bootstrap-counter', {
			state: () => ({ count: 0 })
		});
		useStore(manager);

		mountStatelyInspector();

		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Stately inspector');
		await expect.element(page.getByRole('button', { name: 'Select store bootstrap-counter' })).toBeInTheDocument();

		disposeStatelyInspector();

		await expect.element(page.getByText('Stately inspector')).not.toBeInTheDocument();
	});
});
