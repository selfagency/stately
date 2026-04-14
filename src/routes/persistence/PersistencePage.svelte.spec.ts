import { disposeStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PersistencePage from './+page.svelte';

describe('Persistence page', () => {
  beforeEach(() => {
    disposeStatelyInspector({ resetHook: true });
  });
  afterEach(() => {
    cleanup();
  });

  it('renders section headings', async () => {
    render(PersistencePage);
    await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Persistence');
    await expect.element(page.getByText('Memory adapter', { exact: true })).toBeVisible();
    await expect.element(page.getByText('Pick filtering', { exact: true })).toBeVisible();
    await expect.element(page.getByText('Omit filtering', { exact: true })).toBeVisible();
    await expect.element(page.getByText('LZ-string compression', { exact: true })).toBeVisible();
    await expect.element(page.getByText('TTL expiration', { exact: true })).toBeVisible();
  });

  it('shows inspector toggle button', async () => {
    render(PersistencePage);
    await expect.element(page.getByRole('button', { name: /stately/i })).toBeVisible();
  });

  it('memory adapter: save and rehydrate restores count', async () => {
    render(PersistencePage);
    const count = page.getByTestId('persist-basic-count');
    await expect.element(count).toHaveTextContent('0');

    await page.getByRole('button', { name: 'Increment' }).first().click();
    await expect.element(count).toHaveTextContent('1');

    // Save current state
    await page.getByTestId('persist-basic-save').click();
    // Wait for the async save to complete before resetting
    await expect.element(page.getByTestId('persist-log'), { timeout: 2000 }).toHaveTextContent('Saved: count=1');

    // Reset store back to zero
    await page.getByTestId('persist-basic-reset').click();
    await expect.element(count).toHaveTextContent('0');

    // Rehydrate from adapter
    await page.getByTestId('persist-basic-rehydrate').click();
    await expect.element(count).toHaveTextContent('1');
  });

  it('memory adapter: clear wipes the adapter and resets the store', async () => {
    render(PersistencePage);
    const count = page.getByTestId('persist-basic-count');

    await page.getByRole('button', { name: 'Increment' }).first().click();
    await page.getByTestId('persist-basic-save').click();
    await page.getByTestId('persist-basic-clear').click();
    await expect.element(count).toHaveTextContent('0');
  });

  it('pick filtering: transient field is not restored after rehydrate cycle', async () => {
    render(PersistencePage);
    const transientInput = page.getByTestId('persist-pick-transient');

    // Modify the transient field
    await transientInput.fill('modified');

    // Increment count and do the save → reset → rehydrate cycle
    await page.getByTestId('persist-pick-increment').click();
    await page.getByRole('button', { name: 'Save → reset → rehydrate' }).first().click();

    // After rehydrate, transient should be default "not stored", not "modified"
    await expect.element(transientInput).toHaveValue('not stored');
    // count should still be 1
    await expect.element(page.getByTestId('persist-pick-count')).toHaveTextContent('1');
  });

  it('omit filtering: secret field is not restored after rehydrate cycle', async () => {
    render(PersistencePage);
    const secretInput = page.getByTestId('persist-omit-secret');

    // Modify secret
    await secretInput.fill('top-secret');

    // Increment and cycle
    await page.getByRole('button', { name: 'Increment count' }).nth(1).click();
    await page.getByRole('button', { name: 'Save → reset → rehydrate' }).nth(1).click();

    // Secret should be back to default
    await expect.element(secretInput).toHaveValue('not stored');
    // count persisted
    await expect.element(page.getByTestId('persist-omit-count')).toHaveTextContent('1');
  });

  it('compression: count persists and rehydrates', async () => {
    render(PersistencePage);
    const count = page.getByTestId('persist-compressed-count');
    await expect.element(count).toHaveTextContent('0');

    await page.getByTestId('persist-compressed-increment').click();
    await expect.element(count).toHaveTextContent('1');

    // Single button triggers save→reset→rehydrate atomically
    await page.getByTestId('persist-compressed-reset-rehydrate').click();
    // After the async cycle completes the count should be restored to 1
    await expect.element(count, { timeout: 3000 }).toHaveTextContent('1');
  });

  it('TTL: simulate expiry prevents rehydration', async () => {
    render(PersistencePage);

    await page.getByRole('button', { name: 'Increment' }).nth(3).click();
    await page.getByRole('button', { name: 'Save (2 s TTL)' }).click();
    await page.getByRole('button', { name: 'Simulate expiry' }).click();

    await expect
      .element(page.getByTestId('persist-ttl-expired'))
      .toHaveTextContent('Expired — rehydration discarded stale data');
  });
});
