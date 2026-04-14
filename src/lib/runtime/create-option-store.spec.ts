import { describe, expect, it } from 'vitest';
import { createOptionStore } from './create-option-store.svelte.js';

describe('createOptionStore', () => {
  it('creates a store with reactive state access, computed getters, and bound actions', () => {
    const counter = createOptionStore('counter', {
      state: () => ({ count: 0, label: 'Counter' }),
      getters: {
        doubleCount(state) {
          return state.count * 2;
        },
        displayLabel(state) {
          return `${state.label}: ${state.count}`;
        }
      },
      actions: {
        increment() {
          this.count += 1;
        }
      }
    });

    expect(counter.$id).toBe('counter');
    expect(counter.count).toBe(0);
    expect(counter.doubleCount).toBe(0);
    expect(counter.displayLabel).toBe('Counter: 0');

    counter.increment();
    counter.count += 2;
    counter.label = 'Updated';

    expect(counter.count).toBe(3);
    expect(counter.doubleCount).toBe(6);
    expect(counter.displayLabel).toBe('Updated: 3');
  });
});
