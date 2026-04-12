import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { disposeStatelyInspector, mountStatelyInspector } from './bootstrap-client.js';
import {
	createStatelyInspectorHook,
	getStatelyInspectorHook,
	installStatelyInspectorHook,
	resetStatelyInspectorHookForTests
} from './hook.js';

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

		mountStatelyInspector({ initiallyOpen: true });

		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Stately inspector');
		await expect.element(page.getByRole('combobox', { name: 'Select store bootstrap-counter' })).toBeInTheDocument();

		disposeStatelyInspector();

		await expect.element(page.getByText('Stately inspector')).not.toBeInTheDocument();
	});

	it('can optionally reset the installed global hook when disposing', async () => {
		const hook = createStatelyInspectorHook();
		installStatelyInspectorHook(hook);

		mountStatelyInspector({ initiallyOpen: true });
		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Stately inspector');

		disposeStatelyInspector({ resetHook: true });

		expect(getStatelyInspectorHook()).toBeUndefined();
	});
});
