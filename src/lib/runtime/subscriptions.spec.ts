import { describe, expect, it } from 'vitest';
import { createSubscriptions } from './subscriptions.js';

describe('createSubscriptions', () => {
  it('manages mutation subscriptions, action hooks, and cleanup', async () => {
    const mutations: string[] = [];
    const actions: string[] = [];
    const store = { count: 0 };
    const subscriptions = createSubscriptions<'counter', { count: number }, typeof store>({
      storeId: 'counter',
      state: () => ({ count: store.count }),
      store: () => store
    });

    const unsubscribeMutation = subscriptions.subscribe(
      (mutation, state) => {
        mutations.push(`${mutation.type}:${state.count}`);
      },
      { detached: true }
    );
    const unsubscribeAction = subscriptions.onAction(({ name, after, onError }) => {
      actions.push(`start:${name}`);
      after((result) => actions.push(`after:${String(result)}`));
      onError((error) => actions.push(`error:${String(error)}`));
    });

    subscriptions.notifyMutation('direct', { key: 'count' });
    const increment = subscriptions.wrapAction('increment', function increment(amount: number) {
      store.count += amount;
      return store.count;
    });
    const explode = subscriptions.wrapAction('explode', function explode() {
      throw new Error('boom');
    });

    expect(increment(2)).toBe(2);
    await expect(async () => explode()).rejects.toThrow('boom');

    unsubscribeMutation();
    unsubscribeAction();
    subscriptions.clear();
    store.count += 1;
    subscriptions.notifyMutation('direct', { key: 'count' });

    expect(mutations).toEqual(['direct:0']);
    expect(actions).toEqual(['start:increment', 'after:2', 'start:explode', 'error:Error: boom']);
  });

  it('fires after/onError hooks for thenable actions (non-native Promise)', async () => {
    const results: string[] = [];
    const store = {};
    const subscriptions = createSubscriptions<'t', object, typeof store>({
      storeId: 't',
      state: () => ({}),
      store: () => store
    });

    subscriptions.onAction(({ after, onError }) => {
      after((result) => results.push(`after:${String(result)}`));
      onError((error) => results.push(`error:${String(error)}`));
    });

    // Build a plain thenable (not instanceof Promise) that resolves
    const thenable = {
      then(onFulfilled: (v: string) => void) {
        onFulfilled('resolved');
        return this;
      },
      catch() {
        return this;
      }
    };
    const thenableAction = subscriptions.wrapAction('thenableAction', () => thenable);
    await thenableAction();

    expect(results).toContain('after:resolved');
  });
});
