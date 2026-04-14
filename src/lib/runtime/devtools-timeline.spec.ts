import { describe, expect, it } from 'vitest';
import { createDevtoolsTimelineRecorder } from './devtools-timeline.svelte.js';

describe('createDevtoolsTimelineRecorder', () => {
  it('records mutation and action events with snapshots, timestamps, and durations', async () => {
    let count = 0;
    const timeline = createDevtoolsTimelineRecorder({
      storeId: 'counter',
      readSnapshot: () => ({ count })
    });

    count = 1;
    timeline.recordMutation({
      label: 'patch count',
      payload: { count: 1 }
    });

    const action = timeline.startAction({
      label: 'increment',
      payload: { amount: 2 }
    });
    count = 3;
    action.finish({ result: 3 });

    const entries = timeline.read();

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      storeId: 'counter',
      kind: 'mutation',
      label: 'patch count',
      payload: { count: 1 },
      snapshot: { count: 1 }
    });
    expect(entries[1]).toMatchObject({
      storeId: 'counter',
      kind: 'action',
      label: 'increment',
      payload: { amount: 2 },
      snapshot: { count: 3 },
      result: { result: 3 },
      status: 'completed'
    });
    expect(entries[1].duration).toBeGreaterThanOrEqual(0);
  });

  it('trims entries when maxEntries is exceeded', () => {
    let count = 0;
    const timeline = createDevtoolsTimelineRecorder({
      storeId: 'capped',
      readSnapshot: () => ({ count }),
      maxEntries: 3
    });

    for (let i = 0; i < 5; i++) {
      count = i;
      timeline.recordMutation({ label: `m${i}`, payload: { i } });
    }

    const entries = timeline.read();
    expect(entries).toHaveLength(3);
    expect(entries[0].label).toBe('m2');
    expect(entries[2].label).toBe('m4');
  });
});
