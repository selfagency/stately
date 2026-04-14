import { describe, expect, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import { createStateManager } from '../root/create-state-manager.js';
import { createStatelyInspectorHook, installStatelyInspectorHook, resetStatelyInspectorHookForTests } from './hook.js';

describe('stately inspector store registration', () => {
  it('registers created stores with the active browser hook and unregisters on dispose', () => {
    const hook = createStatelyInspectorHook();
    installStatelyInspectorHook(hook);

    const manager = createStateManager();
    const useCounterStore = defineStore('inspector-counter', {
      state: () => ({ count: 0 })
    });

    const store = useCounterStore(manager);
    const registrations = hook.listStores();

    expect(registrations).toHaveLength(1);
    expect(registrations[0]?.id).toMatch(/^inspector-counter::\d+$/);
    expect(registrations[0]?.label).toBe('inspector-counter');
    expect(registrations[0]?.read()).toMatchObject({
      id: 'inspector-counter',
      state: { count: 0 },
      timeline: []
    });

    store.count += 1;

    expect(registrations[0]?.read()).toMatchObject({
      state: { count: 1 }
    });
    expect(registrations[0]?.read().timeline).toHaveLength(1);
    expect(registrations[0]?.read().timeline[0]).toMatchObject({
      kind: 'mutation',
      label: 'inspector-counter:direct'
    });

    store.$dispose();

    expect(hook.listStores()).toHaveLength(0);
    resetStatelyInspectorHookForTests();
  });

  it('stays inert when no browser hook is installed', () => {
    resetStatelyInspectorHookForTests();

    const manager = createStateManager();
    const useCounterStore = defineStore('inspector-inert', {
      state: () => ({ count: 0 })
    });

    const store = useCounterStore(manager);

    expect(() => store.$patch({ count: 2 })).not.toThrow();
    store.$dispose();
  });
});
