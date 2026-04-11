import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defineStore } from '../define-store.svelte.js';
import { createHistoryPlugin } from '../history/plugin.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createStatelyInspectorHook, installStatelyInspectorHook, resetStatelyInspectorHookForTests } from './hook.js';
import InspectorDrawer from './InspectorDrawer.svelte';

afterEach(() => {
	resetStatelyInspectorHookForTests();
});

describe('InspectorDrawer', () => {
	it('renders registered stores and updates live state and timeline output', async () => {
		const hook = createStatelyInspectorHook();
		installStatelyInspectorHook(hook);
		const manager = createStateManager();
		const useCounterStore = defineStore('drawer-counter', {
			state: () => ({ count: 0 })
		});
		const counter = useCounterStore(manager);

		render(InspectorDrawer, { hook });

		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Stately inspector');
		await expect.element(page.getByRole('button', { name: 'Select store drawer-counter' })).toBeInTheDocument();
		await expect.element(page.getByText(/"count":\s*0/)).toBeInTheDocument();

		counter.count += 1;

		await expect.element(page.getByText(/"count":\s*1/)).toBeInTheDocument();
		await expect.element(page.getByText('drawer-counter:direct')).toBeInTheDocument();
		await expect.element(page.getByText('History unavailable for this store.')).toBeInTheDocument();
	});

	it('shows history controls when available and replays snapshots', async () => {
		const hook = createStatelyInspectorHook();
		installStatelyInspectorHook(hook);
		const manager = createStateManager().use(createHistoryPlugin());
		const useCounterStore = defineStore('drawer-history', {
			state: () => ({ count: 0 }),
			history: { limit: 5 }
		} as {
			state: () => { count: number };
			history: { limit: number };
		});
		const counter = useCounterStore(manager);

		counter.count = 1;
		counter.count = 2;

		render(InspectorDrawer, { hook });

		await expect.element(page.getByRole('button', { name: 'Select store drawer-history' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Go to history entry 0' })).toBeInTheDocument();

		await page.getByRole('button', { name: 'Go to history entry 0' }).click();

		await expect.element(page.getByText(/"count":\s*0/)).toBeInTheDocument();
		await expect.element(page.getByText('Current history index: 0')).toBeInTheDocument();
	});
});
