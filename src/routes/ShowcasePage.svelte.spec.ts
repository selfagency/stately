import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ShowcasePage from './+page.svelte';

describe('showcase landing page', () => {
  it('renders the landing hub with heading and feature grid', async () => {
    render(ShowcasePage);

    await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Stately showcase');
    await expect.element(page.getByTestId('feature-grid')).toBeInTheDocument();
  });

  it('has links to all seven feature routes', async () => {
    render(ShowcasePage);

    for (const label of ['Core', 'Sync', 'Persistence', 'History', 'Async', 'FSM', 'Validation']) {
      await expect.element(page.getByRole('link', { name: `Explore ${label}` })).toBeInTheDocument();
    }
  });

  it('has the Stately inspector toggle button in the DOM', async () => {
    render(ShowcasePage);
    await expect.element(page.getByRole('button', { name: 'Stately' })).toBeInTheDocument();
  });
});
