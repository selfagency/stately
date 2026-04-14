import { describe, expect, it } from 'vitest';
import {
  createStatelyInspectorHook,
  getStatelyInspectorHook,
  installStatelyInspectorHook,
  resetStatelyInspectorHook
} from './hook.js';
import type { StatelyInspectorStoreAdapter } from './types.js';

function createAdapter(label: string): StatelyInspectorStoreAdapter {
  return {
    id: label,
    label,
    read() {
      return { id: label, state: {}, timeline: [] };
    },
    subscribe() {
      return () => {};
    },
    goToHistory() {
      return false;
    },
    dispose() {}
  };
}

describe('stately inspector hook', () => {
  it('assigns monotonic duplicate labels even after an intermediate store is removed', () => {
    const hook = createStatelyInspectorHook();

    const unregisterPrimary = hook.registerStore(createAdapter('duplicate-store'));
    const unregisterSecondary = hook.registerStore(createAdapter('duplicate-store'));
    hook.registerStore(createAdapter('duplicate-store'));

    expect(hook.listStores().map((store) => store.label)).toEqual([
      'duplicate-store',
      'duplicate-store (1)',
      'duplicate-store (2)'
    ]);

    unregisterSecondary();
    hook.registerStore(createAdapter('duplicate-store'));

    expect(hook.listStores().map((store) => store.label)).toEqual([
      'duplicate-store',
      'duplicate-store (2)',
      'duplicate-store (3)'
    ]);

    unregisterPrimary();
  });

  it('can reset the installed global hook', () => {
    const hook = installStatelyInspectorHook(createStatelyInspectorHook());

    expect(getStatelyInspectorHook()).toBe(hook);

    resetStatelyInspectorHook();

    expect(getStatelyInspectorHook()).toBeUndefined();
  });
});
