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
  it('opens from the launcher, respects custom placement, and renders the empty state', async () => {
    const hook = createStatelyInspectorHook();

    render(InspectorDrawer, {
      hook,
      buttonPosition: 'left-top',
      panelSide: 'left'
    });

    const launcher = page.getByRole('button', { name: 'Stately' }).nth(0);
    await expect.element(launcher).toHaveAttribute('aria-expanded', 'false');
    await expect.element(launcher).toHaveClass(/left-4/);
    await expect.element(launcher).toHaveClass(/top-4/);

    await launcher.click();

    const inspector = page.getByLabelText('Stately inspector');
    await expect.element(launcher).toHaveAttribute('aria-expanded', 'true');
    await expect.element(inspector).toHaveClass(/left-4/);
    await expect.element(page.getByText('No stores detected.')).toBeInTheDocument();

    await page.getByRole('button', { name: 'Close Stately' }).click();
    await expect.element(launcher).toHaveAttribute('aria-expanded', 'false');
  });

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

  it('switches between registered stores from the picker', async () => {
    const hook = createStatelyInspectorHook();
    installStatelyInspectorHook(hook);
    const manager = createStateManager();

    const usePrimaryStore = defineStore('drawer-primary', {
      state: () => ({ count: 1 })
    });
    const useSecondaryStore = defineStore('drawer-secondary', {
      state: () => ({ count: 9 })
    });

    usePrimaryStore(manager);
    useSecondaryStore(manager);

    render(InspectorDrawer, { hook, initiallyOpen: true });

    await expect.element(page.getByRole('combobox', { name: 'Select store drawer-primary' })).toBeInTheDocument();
    await expect.element(page.getByText(/"count":\s*1/)).toBeInTheDocument();

    await page.getByRole('combobox', { name: 'Select store drawer-primary' }).click();
    await page.getByText('drawer-secondary').click();

    await expect.element(page.getByRole('combobox', { name: 'Select store drawer-secondary' })).toBeInTheDocument();
    await expect.element(page.getByText(/"count":\s*9/)).toBeInTheDocument();
  });

  it('shows the limited-history playback message when only one snapshot exists', async () => {
    const hook = createStatelyInspectorHook();
    installStatelyInspectorHook(hook);
    const manager = createStateManager().use(createHistoryPlugin());
    const useCounterStore = defineStore('drawer-history-limited', {
      state: () => ({ count: 0 }),
      history: { limit: 5 }
    } as {
      state: () => { count: number };
      history: { limit: number };
    });

    useCounterStore(manager);

    render(InspectorDrawer, { hook, initiallyOpen: true });

    await expect
      .element(page.getByText('Playback unavailable because this store needs at least two history entries.'))
      .toBeInTheDocument();
  });

  it('shows history controls when available', async () => {
    const hook = createStatelyInspectorHook();
    installStatelyInspectorHook(hook);
    hook.notifyNotice({
      message: 'History replay is available for this store.',
      level: 'alert',
      timestamp: Date.now()
    });
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
    const stateSnapshot = page.getByLabelText('State snapshot');

    await expect.element(page.getByRole('combobox', { name: 'Select store drawer-history' })).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Skip to first history entry' })).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Play history' })).toBeInTheDocument();
    await expect.element(page.getByText('Frame 3 of 3')).toBeInTheDocument();

    await page.getByRole('button', { name: 'Skip to first history entry' }).click();
    await expect.element(page.getByText('Frame 1 of 3')).toBeInTheDocument();
    await expect.element(stateSnapshot).toHaveTextContent(/"count":\s*0/);

    await page.getByRole('button', { name: 'Step forward history' }).click();
    await expect.element(page.getByText('Frame 2 of 3')).toBeInTheDocument();
    await expect.element(stateSnapshot).toHaveTextContent(/"count":\s*1/);

    await page.getByRole('button', { name: 'Play history' }).click();
    await expect.element(page.getByText('Frame 3 of 3')).toBeInTheDocument();
    await expect.element(stateSnapshot).toHaveTextContent(/"count":\s*2/);

    await page.getByRole('button', { name: 'Step backward history' }).click();
    await expect.element(page.getByText('Frame 2 of 3')).toBeInTheDocument();

    await expect.element(page.getByText('alert: History replay is available for this store.')).toBeInTheDocument();
    await page.getByRole('button', { name: 'Clear warnings' }).click();
    await expect.element(page.getByText('alert: History replay is available for this store.')).not.toBeInTheDocument();
  });
});
