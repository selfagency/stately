import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { disposeStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import FsmPage from './+page.svelte';

describe('FSM page', () => {
  beforeEach(() => {
    disposeStatelyInspector({ resetHook: true });
  });
  afterEach(() => {
    cleanup();
  });

  it('renders section headings', async () => {
    render(FsmPage);
    await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('FSM');
    await expect.element(page.getByText('Traffic light', { exact: true })).toBeVisible();
    await expect.element(page.getByText('Order workflow', { exact: true })).toBeVisible();
  });

  it('shows inspector toggle button', async () => {
    render(FsmPage);
    await expect.element(page.getByRole('button', { name: /stately/i })).toBeVisible();
  });

  it('traffic light: starts at red', async () => {
    render(FsmPage);
    await expect.element(page.getByTestId('fsm-traffic-state')).toHaveTextContent('red');
  });

  it('traffic light: red → green → yellow → red cycle', async () => {
    render(FsmPage);
    const state = page.getByTestId('fsm-traffic-state');

    await page.getByTestId('fsm-traffic-next').click();
    await expect.element(state).toHaveTextContent('green');

    await page.getByTestId('fsm-traffic-next').click();
    await expect.element(state).toHaveTextContent('yellow');

    await page.getByTestId('fsm-traffic-next').click();
    await expect.element(state).toHaveTextContent('red');
  });

  it('order workflow: starts at idle with Start order button', async () => {
    render(FsmPage);
    await expect.element(page.getByTestId('fsm-order-state')).toHaveTextContent('idle');
    await expect.element(page.getByTestId('fsm-order-start')).toBeVisible();
  });

  it('order workflow: full happy-path cycle', async () => {
    render(FsmPage);
    const state = page.getByTestId('fsm-order-state');

    // idle → draft
    await page.getByTestId('fsm-order-start').click();
    await expect.element(state).toHaveTextContent('draft');

    // draft → pending
    await page.getByTestId('fsm-order-submit').click();
    await expect.element(state).toHaveTextContent('pending');

    // pending → fulfilled
    await page.getByTestId('fsm-order-approve').click();
    await expect.element(state).toHaveTextContent('fulfilled');

    // fulfilled → idle
    await page.getByTestId('fsm-order-reset').click();
    await expect.element(state).toHaveTextContent('idle');
  });

  it('order workflow: rejected path with retry', async () => {
    render(FsmPage);
    const state = page.getByTestId('fsm-order-state');

    await page.getByTestId('fsm-order-start').click();
    await page.getByTestId('fsm-order-submit').click();
    await page.getByTestId('fsm-order-reject').click();
    await expect.element(state).toHaveTextContent('rejected');

    await page.getByTestId('fsm-order-retry').click();
    await expect.element(state).toHaveTextContent('draft');
  });
});
