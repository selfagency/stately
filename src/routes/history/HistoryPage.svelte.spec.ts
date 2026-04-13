import { disposeStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import HistoryPage from './+page.svelte';

describe('History page', () => {
	beforeEach(() => {
		disposeStatelyInspector({ resetHook: true });
	});
	afterEach(() => {
		cleanup();
	});

	it('renders section headings', async () => {
		render(HistoryPage);
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('History');
		await expect.element(page.getByText('Undo / Redo', { exact: true }).first()).toBeVisible();
		await expect.element(page.getByText('Batch operations', { exact: true }).first()).toBeVisible();
		await expect.element(page.getByText('Time travel', { exact: true }).first()).toBeVisible();
	});

	it('shows inspector toggle button', async () => {
		render(HistoryPage);
		await expect.element(page.getByRole('button', { name: /stately/i })).toBeVisible();
	});

	it('increment records history entries', async () => {
		render(HistoryPage);
		const count = page.getByTestId('history-count');
		const entryCount = page.getByTestId('history-entry-count');

		await expect.element(count).toHaveTextContent('0');
		await expect.element(entryCount).toHaveTextContent('1');

		await page.getByTestId('history-increment').click();
		await expect.element(count).toHaveTextContent('1');
		await expect.element(entryCount).toHaveTextContent('2');
	});

	it('undo reverts last mutation', async () => {
		render(HistoryPage);
		const count = page.getByTestId('history-count');

		await page.getByTestId('history-increment').click();
		await expect.element(count).toHaveTextContent('1');

		await page.getByTestId('history-undo').click();
		await expect.element(count).toHaveTextContent('0');
	});

	it('redo re-applies after undo', async () => {
		render(HistoryPage);
		const count = page.getByTestId('history-count');

		await page.getByTestId('history-increment').click();
		await page.getByTestId('history-undo').click();
		await expect.element(count).toHaveTextContent('0');

		await page.getByTestId('history-redo').click();
		await expect.element(count).toHaveTextContent('1');
	});

	it('batch records three increments as one history entry', async () => {
		render(HistoryPage);
		const count = page.getByTestId('history-count');
		const entryCount = page.getByTestId('history-entry-count');

		await page.getByTestId('history-batch').click();
		await expect.element(count).toHaveTextContent('3');
		// batch = 1 extra entry, not 3
		await expect.element(entryCount).toHaveTextContent('2');
	});

	it('time travel: clicking entry 0 restores initial snapshot', async () => {
		render(HistoryPage);
		const count = page.getByTestId('history-count');
		const currentIndex = page.getByTestId('history-current-index');

		await page.getByTestId('history-increment').click();
		await page.getByTestId('history-increment').click();
		await expect.element(count).toHaveTextContent('2');

		// Click the first timeline entry (index 0)
		const timeline = page.getByTestId('history-timeline');
		await timeline.getByText('count = 0').click();

		await expect.element(count).toHaveTextContent('0');
		await expect.element(currentIndex).toHaveTextContent('0');
	});
});
