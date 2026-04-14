import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { disposeStatelyInspector } from '../../lib/inspector/bootstrap-client.js';
import CorePage from './+page.svelte';

describe('core page', () => {
  beforeEach(() => {
    disposeStatelyInspector({ resetHook: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('option store: increment and decrement update count and doubled', async () => {
    render(CorePage);

    await expect.element(page.getByTestId('core-option-count')).toHaveTextContent('count: 0');
    await expect.element(page.getByTestId('core-option-doubled')).toHaveTextContent('doubled: 0');

    await page.getByRole('button', { name: 'Increment' }).first().click();
    await expect.element(page.getByTestId('core-option-count')).toHaveTextContent('count: 1');
    await expect.element(page.getByTestId('core-option-doubled')).toHaveTextContent('doubled: 2');

    await page.getByRole('button', { name: 'Decrement' }).first().click();
    await expect.element(page.getByTestId('core-option-count')).toHaveTextContent('count: 0');
  });

  it('setup store: increment and decrement update count and doubled', async () => {
    render(CorePage);

    await expect.element(page.getByTestId('core-setup-count')).toHaveTextContent('count: 0');

    await page.getByRole('button', { name: 'Increment (setup)' }).click();
    await expect.element(page.getByTestId('core-setup-count')).toHaveTextContent('count: 1');
    await expect.element(page.getByTestId('core-setup-doubled')).toHaveTextContent('doubled: 2');

    await page.getByRole('button', { name: 'Decrement (setup)' }).click();
    await expect.element(page.getByTestId('core-setup-count')).toHaveTextContent('count: 0');
  });

  it('storeToRefs: refs stay reactive when the option store mutates', async () => {
    render(CorePage);

    await expect.element(page.getByTestId('core-refs-count')).toHaveTextContent('refs.count.value: 0');

    await page.getByRole('button', { name: 'Increment' }).first().click();
    await expect.element(page.getByTestId('core-refs-count')).toHaveTextContent('refs.count.value: 1');
    await expect.element(page.getByTestId('core-refs-doubled')).toHaveTextContent('refs.doubled.value: 2');
  });

  it('$patch object form applies a partial update', async () => {
    render(CorePage);

    await page.getByRole('button', { name: '$patch object' }).click();
    await expect.element(page.getByTestId('core-patch-count')).toHaveTextContent('count after: 42');
    await expect.element(page.getByTestId('core-patch-log')).toHaveTextContent('$patch({ count: 42 }) — object form');
  });

  it('$patch function form applies a mutation callback', async () => {
    render(CorePage);

    await page.getByRole('button', { name: '$patch function' }).click();
    await expect.element(page.getByTestId('core-patch-count')).toHaveTextContent('count after: 10');
    await expect.element(page.getByTestId('core-patch-log')).toHaveTextContent('function form');
  });

  it('$reset restores initial state', async () => {
    render(CorePage);

    await page.getByRole('button', { name: '$patch object' }).click();
    await expect.element(page.getByTestId('core-patch-count')).toHaveTextContent('count after: 42');

    await page.getByRole('button', { name: '$reset' }).click();
    await expect.element(page.getByTestId('core-patch-count')).toHaveTextContent('count after: 0');
  });

  it('$subscribe log updates when state mutates', async () => {
    render(CorePage);

    await expect.element(page.getByTestId('core-subscribe-log')).toHaveTextContent('(no mutations yet)');

    await page.getByRole('button', { name: 'Trigger mutation' }).click();
    await expect.element(page.getByTestId('core-subscribe-log')).toHaveTextContent('count →');
  });

  it('section 07: subscribe button enables the trigger button', async () => {
    render(CorePage);

    const log = page.getByTestId('core-dispose-log');
    const toggle = page.getByTestId('core-dispose-toggle');

    await expect.element(log).toHaveTextContent('not subscribed');
    // trigger button hidden before subscribing
    await expect.element(page.getByTestId('core-trigger-mutation')).not.toBeInTheDocument();

    await toggle.click();
    await expect.element(log).toHaveTextContent('subscribed — listening for mutations');
    await expect.element(page.getByTestId('core-trigger-mutation')).toBeVisible();
  });

  it('section 07: triggering a mutation while subscribed updates the log', async () => {
    render(CorePage);

    await page.getByTestId('core-dispose-toggle').click();
    await expect.element(page.getByTestId('core-trigger-mutation')).toBeVisible();

    await page.getByTestId('core-trigger-mutation').click();
    await expect.element(page.getByTestId('core-dispose-log')).toHaveTextContent('mutation received');
  });

  it('section 07: unsubscribing hides the trigger button and updates the log', async () => {
    render(CorePage);

    const toggle = page.getByTestId('core-dispose-toggle');
    await toggle.click(); // subscribe
    await expect.element(page.getByTestId('core-trigger-mutation')).toBeVisible();

    await toggle.click(); // unsubscribe
    await expect.element(page.getByTestId('core-dispose-log')).toHaveTextContent('subscription removed');
    await expect.element(page.getByTestId('core-trigger-mutation')).not.toBeInTheDocument();
  });

  it('before-action guard blocks increment when active', async () => {
    render(CorePage);

    // Without guard: increment works
    await page.getByTestId('core-guarded-increment').click();
    await expect.element(page.getByTestId('core-guard-count')).toHaveTextContent('count: 1');

    // Enable guard
    await page.getByTestId('core-guard-toggle').click();
    await expect.element(page.getByTestId('core-guard-status')).toHaveTextContent('guard: blocking');

    // Increment is now blocked
    await page.getByTestId('core-guarded-increment').click();
    await expect.element(page.getByTestId('core-guard-count')).toHaveTextContent('count: 1');

    // Disable guard
    await page.getByTestId('core-guard-toggle').click();
    await expect.element(page.getByTestId('core-guard-status')).toHaveTextContent('guard: inactive');

    // Increment works again
    await page.getByTestId('core-guarded-increment').click();
    await expect.element(page.getByTestId('core-guard-count')).toHaveTextContent('count: 2');
  });

  it('inspector toggle button is present in the DOM', async () => {
    render(CorePage);
    await expect.element(page.getByRole('button', { name: 'Stately' })).toBeInTheDocument();
  });

  it('inspector panel opens when the toggle button is clicked', async () => {
    render(CorePage);

    await page.getByRole('button', { name: 'Stately' }).click();
    await expect.element(page.getByRole('complementary', { name: 'Stately inspector' })).toBeInTheDocument();
  });

  it('inspector accordion reflects live store state', async () => {
    render(CorePage);

    // Increment the option store first — before opening the inspector panel
    await page.getByRole('button', { name: 'Increment' }).first().click();
    await expect.element(page.getByTestId('core-option-count')).toHaveTextContent('count: 1');

    // Open inspector
    await page.getByRole('button', { name: 'Stately' }).click();
    await expect.element(page.getByRole('complementary', { name: 'Stately inspector' })).toBeInTheDocument();

    // Inspector panel should list registered stores
    await expect.element(page.getByRole('combobox', { name: /Select store/ })).toBeInTheDocument();

    // Inspector state snapshot should already reflect count: 1
    await expect.element(page.getByRole('complementary', { name: 'Stately inspector' })).toHaveTextContent('1');
  });
});
