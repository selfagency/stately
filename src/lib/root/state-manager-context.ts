import { createContext } from 'svelte';
import { createStateManager } from './create-state-manager.js';
import type { StateManager } from './types.js';

export const [getStateManagerContext, setStateManagerContext] = createContext<StateManager>();

/**
 * SSR-safe helper for layout or component boundaries that need a request-scoped manager.
 * Prefer this over singleton state when rendering through SvelteKit on the server.
 */
export function initializeStateManagerContext(manager: StateManager = createStateManager()): StateManager {
  return setStateManagerContext(manager);
}

export { getStateManagerContext as getStateManager, setStateManagerContext as setStateManager };
