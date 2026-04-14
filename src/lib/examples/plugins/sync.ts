import { createStateManager, createSyncPlugin, defineStore } from '../../index.js';

export const usePresenceStore = defineStore('example-plugin-sync', {
  state: () => ({ count: 0, originLabel: 'local tab' }),
  actions: {
    increment() {
      this.count += 1;
    }
  }
});

export const createSyncedManager = (origin: string) =>
  createStateManager().use(createSyncPlugin({ origin, channelName: 'stately-example-sync' }));
