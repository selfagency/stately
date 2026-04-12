import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ShowcasePage from './+page.svelte';

describe('showcase page', () => {
	it('demonstrates sync, persistence, history, time travel, and async orchestration from the user perspective', async () => {
		render(ShowcasePage);

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Stately showcase');
		await expect.element(page.getByRole('button', { name: 'Stately' })).toBeInTheDocument();

		await page.getByRole('button', { name: 'Increment Tab A by 1' }).click();
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('1');
		await expect.element(page.getByTestId('tab-b-count')).toHaveTextContent('1');
		await expect.element(page.getByText(/"count":\s*1/)).toBeInTheDocument();

		await page.getByRole('button', { name: 'Save current snapshot' }).click();
		await expect.element(page.getByText(/"count":1/)).toBeInTheDocument();

		await page.getByRole('button', { name: 'Make unsaved local change' }).click();
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('6');
		await expect.element(page.getByTestId('tab-b-count')).toHaveTextContent('6');

		await page.getByRole('button', { name: 'Restore saved snapshot' }).click();
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('1');
		await expect.element(page.getByTestId('tab-b-count')).toHaveTextContent('1');

		await page.getByRole('button', { name: 'Batch add five' }).click();
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('6');

		await page.getByRole('button', { name: 'Undo last change' }).click();
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('1');

		await page.getByRole('button', { name: 'Redo last change' }).click();
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('6');

		await page.getByRole('button', { name: 'Jump to first snapshot' }).click();
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('0');

		await page.getByRole('button', { name: 'Load 12 asynchronously' }).click();
		await expect.element(page.getByText('Loading showcase value…')).toBeInTheDocument();
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('12');
		await expect.element(page.getByTestId('tab-b-count')).toHaveTextContent('12');

		await page.getByRole('button', { name: 'Load 24 asynchronously' }).click();
		await expect.element(page.getByText('Loading showcase value…')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Cancel pending async load' }).click();
		await expect.element(page.getByRole('status')).toHaveTextContent('Async request cancelled');
		await expect.element(page.getByTestId('tab-a-count')).toHaveTextContent('12');
	});
});
