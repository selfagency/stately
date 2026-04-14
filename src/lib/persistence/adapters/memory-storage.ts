import type { PersistenceAdapter } from '../types.js';

export function createMemoryStorageAdapter(): PersistenceAdapter {
  const storage = new Map<string, string>();

  return {
    async getItem(key) {
      return storage.get(key) ?? null;
    },
    async setItem(key, value) {
      storage.set(key, value);
    },
    async removeItem(key) {
      storage.delete(key);
    },
    async clear() {
      storage.clear();
    },
    async keys() {
      return [...storage.keys()];
    }
  };
}
