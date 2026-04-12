import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
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
		hook.notifyNotice({
			message: 'Compression failed for store "drawer-counter".',
			level: 'warning',
			timestamp: Date.now()
		});
		const manager = createStateManager();
		const useCounterStore = defineStore('drawer-counter', {
			state: () => ({ count: 0 })
		});
		const counter = useCounterStore(manager);

		render(InspectorDrawer, { hook, initiallyOpen: true });

		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Stately inspector');
		await expect.element(page.getByText('warning: Compression failed for store "drawer-counter".')).toBeInTheDocument();
		await expect.element(page.getByRole('combobox', { name: 'Select store drawer-counter' })).toBeInTheDocument();
		await expect.element(page.getByText(/"count":\s*0/)).toBeInTheDocument();

		counter.count += 1;

		await expect.element(page.getByText(/"count":\s*1/)).toBeInTheDocument();
		await expect.element(page.getByText('drawer-counter:direct')).toBeInTheDocument();
		await expect
			.element(page.getByText('Playback unavailable because this store does not expose history.'))
			.toBeInTheDocument();
	});

	it('shows history controls when available', async () => {
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

		render(InspectorDrawer, { hook, initiallyOpen: true });

		await expect.element(page.getByRole('combobox', { name: 'Select store drawer-history' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Skip to first history entry' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Play history' })).toBeInTheDocument();
	});
});
