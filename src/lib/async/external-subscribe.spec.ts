import { describe, expect, it } from 'vitest';
import { createExternalSubscriber } from './external-subscribe.js';

describe('createExternalSubscriber', () => {
  it('bridges external subscriptions into a reactive current value API', () => {
    const listeners = new Set<() => void>();
    let value = 0;
    const bridge = createExternalSubscriber({
      getSnapshot: () => value,
      subscribe(update) {
        listeners.add(update);
        return () => listeners.delete(update);
      }
    });

    expect(bridge.current).toBe(0);
    value = 2;
    for (const listener of listeners) {
      listener();
    }
    expect(bridge.current).toBe(2);
    bridge.unsubscribe();
    expect(listeners.size).toBe(0);
  });
});
