import { describe, expect, it } from 'vitest';
import { createMutationQueue } from './mutation-queue.svelte.js';

describe('createMutationQueue', () => {
  it('groups nested patch-function work into one logical commit and preserves commit ordering', () => {
    const events: Array<{ type: string; payload: unknown }> = [];
    const queue = createMutationQueue({
      storeId: 'counter',
      notify(type, payload) {
        events.push({ type, payload });
      }
    });

    queue.run('patch-function', { label: 'outer' }, () => {
      queue.recordChange({ key: 'count', value: 1 });
      queue.run('patch-function', { label: 'inner' }, () => {
        queue.recordChange({ key: 'count', value: 2 });
      });
    });

    queue.run('patch-function', { label: 'next' }, () => {
      queue.recordChange({ key: 'count', value: 3 });
    });

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('patch-function');
    expect(events[1].type).toBe('patch-function');
    expect(events[0].payload).toMatchObject({
      commit: { id: 1, storeId: 'counter', type: 'patch-function', mutationCount: 2 },
      payload: { label: 'outer' }
    });
    expect(events[1].payload).toMatchObject({
      commit: { id: 2, storeId: 'counter', type: 'patch-function', mutationCount: 1 },
      payload: { label: 'next' }
    });
  });
});
