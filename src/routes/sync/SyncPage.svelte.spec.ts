import { disposeStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import SyncPage from './+page.svelte';

describe('Sync page', () => {
	beforeEach(() => {
		disposeStatelyInspector({ resetHook: true });
	});
	afterEach(() => {
		cleanup();
	});

	it('renders section headings', async () => {
		render(SyncPage);
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Sync');
		await expect.element(page.getByText('In-memory sync bus', { exact: true })).toBeVisible();
		await expect.element(page.getByText('BroadcastChannel sync', { exact: true })).toBeVisible();
	});

	it('shows inspector toggle button', async () => {
		render(SyncPage);
		await expect.element(page.getByRole('button', { name: /stately/i })).toBeVisible();
	});

	it('demo sections appear after mount (lazy initialization)', async () => {
		render(SyncPage);
		// Both count displays start at 0 — confirms onMount ran and demo was created
		await expect.element(page.getByTestId('sync-mem-a-count')).toHaveTextContent('0');
		await expect.element(page.getByTestId('sync-mem-b-count')).toHaveTextContent('0');
		await expect.element(page.getByTestId('sync-bc-primary-count')).toHaveTextContent('0');
		await expect.element(page.getByTestId('sync-bc-peer-count')).toHaveTextContent('0');
	});

	it('in-memory: incrementing Tab A reflects on Tab B', async () => {
		render(SyncPage);
		const countA = page.getByTestId('sync-mem-a-count');
		const countB = page.getByTestId('sync-mem-b-count');

		await expect.element(countA).toHaveTextContent('0');
		await expect.element(countB).toHaveTextContent('0');

		await page.getByRole('button', { name: 'Increment Tab A' }).click();

		await expect.element(countA).toHaveTextContent('1');
		await expect.element(countB).toHaveTextContent('1');
	});

	it('in-memory: incrementing Tab B reflects on Tab A', async () => {
		render(SyncPage);
		const countA = page.getByTestId('sync-mem-a-count');
		const countB = page.getByTestId('sync-mem-b-count');

		await page.getByRole('button', { name: 'Increment Tab B' }).click();

		await expect.element(countA).toHaveTextContent('1');
		await expect.element(countB).toHaveTextContent('1');
	});

	it('BroadcastChannel: incrementing Primary updates its own count', async () => {
		render(SyncPage);
		const countPrimary = page.getByTestId('sync-bc-primary-count');

		await expect.element(countPrimary).toHaveTextContent('0');

		await page.getByRole('button', { name: 'Increment Primary' }).click();

		await expect.element(countPrimary).toHaveTextContent('1');
	});

	it('BroadcastChannel: incrementing Peer updates its own count', async () => {
		render(SyncPage);
		const countPeer = page.getByTestId('sync-bc-peer-count');

		await expect.element(countPeer).toHaveTextContent('0');

		await page.getByRole('button', { name: 'Increment Peer' }).click();

		await expect.element(countPeer).toHaveTextContent('1');
	});
});
