import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { disposeStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import ValidationPage from './+page.svelte';

describe('Validation page', () => {
	beforeEach(() => {
		disposeStatelyInspector({ resetHook: true });
	});
	afterEach(() => {
		cleanup();
	});

	it('renders section headings', async () => {
		render(ValidationPage);
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Validation');
		await expect.element(page.getByText('Counter with guard', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Form validation', { exact: true })).toBeVisible();
	});

	it('shows inspector toggle button', async () => {
		render(ValidationPage);
		await expect.element(page.getByRole('button', { name: /stately/i })).toBeVisible();
	});

	it('counter: valid positive value updates count', async () => {
		render(ValidationPage);
		const value = page.getByTestId('validation-counter-value');
		await expect.element(value).toHaveTextContent('0');

		await page.getByTestId('validation-counter-input').fill('5');
		await page.getByTestId('validation-counter-submit').click();

		await expect.element(value).toHaveTextContent('5');
		// No error shown
		await expect.element(page.getByTestId('validation-counter-error')).not.toBeInTheDocument();
	});

	it('counter: negative value shows error and leaves count unchanged', async () => {
		render(ValidationPage);
		const value = page.getByTestId('validation-counter-value');

		await page.getByTestId('validation-counter-invalid').click();

		// count stays 0
		await expect.element(value).toHaveTextContent('0');
		// error shown
		await expect.element(page.getByTestId('validation-counter-error')).toHaveTextContent('Count must be non-negative');
	});

	it('form: valid submission shows success message', async () => {
		render(ValidationPage);

		await page.getByTestId('validation-form-name').fill('Alice');
		await page.getByTestId('validation-form-email').fill('alice@example.com');
		await page.getByTestId('validation-form-submit').click();

		await expect.element(page.getByTestId('validation-form-success')).toBeVisible();
		// No error
		await expect.element(page.getByTestId('validation-form-error')).not.toBeInTheDocument();
	});

	it('form: missing name shows error', async () => {
		render(ValidationPage);

		await page.getByTestId('validation-form-email').fill('test@example.com');
		await page.getByTestId('validation-form-submit').click();

		await expect.element(page.getByTestId('validation-form-error')).toHaveTextContent('Name is required');
	});

	it('form: invalid email shows error', async () => {
		render(ValidationPage);

		await page.getByTestId('validation-form-name').fill('Bob');
		await page.getByTestId('validation-form-email').fill('not-an-email');
		await page.getByTestId('validation-form-submit').click();

		await expect.element(page.getByTestId('validation-form-error')).toHaveTextContent('A valid email is required');
	});
});
