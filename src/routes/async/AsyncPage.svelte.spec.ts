import { disposeStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import AsyncPage from './+page.svelte';

describe('Async page', () => {
	beforeEach(() => {
		disposeStatelyInspector({ resetHook: true });
	});
	afterEach(() => {
		cleanup();
	});

	it('renders section headings', async () => {
		render(AsyncPage);
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Async');
		await expect.element(page.getByText('Restartable', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Drop', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Error state', { exact: true })).toBeVisible();
		await expect.element(page.getByText('debounceAction', { exact: true })).toBeVisible();
		await expect.element(page.getByText('throttleAction', { exact: true })).toBeVisible();
	});

	it('shows inspector toggle button', async () => {
		render(AsyncPage);
		await expect.element(page.getByRole('button', { name: /stately/i })).toBeVisible();
	});

	it('restartable: isLoading flips to true while request is in-flight', async () => {
		render(AsyncPage);
		const loading = page.getByTestId('async-restartable-loading');
		await expect.element(loading).toHaveTextContent('false');

		// Start a load — after click(), the event handler has fired and isLoading is true
		// while the 600ms async operation is still running
		await page.getByTestId('async-restartable-btn').click();
		await expect.element(loading).toHaveTextContent('true');
	});

	it('restartable: value is set after load completes', async () => {
		render(AsyncPage);

		await page.getByTestId('async-restartable-btn').click();
		// 600ms timeout + margin
		await expect
			.element(page.getByTestId('async-restartable-value'), { timeout: 1500 })
			.toHaveTextContent('data loaded');
	});

	it('drop: extra clicks while loading do not increment call count', async () => {
		render(AsyncPage);
		const calls = page.getByTestId('async-drop-calls');
		await expect.element(calls).toHaveTextContent('0');

		// First click: starts the 600ms operation, sets isLoading=true
		await page.getByTestId('async-drop-btn').click();
		await expect.element(page.getByTestId('async-drop-loading')).toHaveTextContent('true');

		// Click again while loading — should be dropped (operation still running at 600ms)
		await page.getByTestId('async-drop-btn').click();
		await page.getByTestId('async-drop-btn').click();

		// Still 1 call despite multiple clicks
		await expect.element(calls).toHaveTextContent('1');
	});

	it('error: success shows value', async () => {
		render(AsyncPage);
		await page.getByTestId('async-error-success-btn').click();
		await expect.element(page.getByTestId('async-error-value'), { timeout: 1000 }).toHaveTextContent('data loaded');
		await expect.element(page.getByTestId('async-error-message')).toHaveTextContent('—');
	});

	it('error: failure shows error message', async () => {
		render(AsyncPage);
		await page.getByTestId('async-error-fail-btn').click();
		await expect.element(page.getByTestId('async-error-message'), { timeout: 1000 }).toHaveTextContent('API error');
	});

	it('debounce: button renders and is clickable', async () => {
		render(AsyncPage);
		await expect.element(page.getByTestId('async-debounce-btn')).toBeVisible();
		// debounce log starts empty
		await expect.element(page.getByTestId('async-debounce-log')).toHaveTextContent('No fires yet');
	});

	it('throttle: button renders and is clickable', async () => {
		render(AsyncPage);
		await expect.element(page.getByTestId('async-throttle-btn')).toBeVisible();
		// throttle fires immediately on first click
		await page.getByTestId('async-throttle-btn').click();
		// after at least one fire, log should update
		await expect.element(page.getByTestId('async-throttle-log')).not.toHaveTextContent('No fires yet');
	});
});
