import { createHistoryPlugin, createStateManager, defineStore } from '../../index.js';

export const useDraftStore = defineStore('example-plugin-history', {
  state: () => ({ count: 0 }),
  history: { limit: 25 },
  actions: {
    increment() {
      this.count += 1;
    }
  }
});

export const historyManager = createStateManager().use(createHistoryPlugin());
