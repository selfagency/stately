import {
  createLocalStorageAdapter,
  createLzStringCompression,
  createMemoryStorageAdapter,
  createPersistencePlugin,
  createStateManager,
  defineStore
} from '../../index.js';

const fallbackAdapter = createMemoryStorageAdapter();

const safeLocalStorageAdapter = {
  getItem(key: string) {
    return typeof localStorage === 'undefined'
      ? fallbackAdapter.getItem(key)
      : createLocalStorageAdapter().getItem(key);
  },
  setItem(key: string, value: string) {
    return typeof localStorage === 'undefined'
      ? fallbackAdapter.setItem(key, value)
      : createLocalStorageAdapter().setItem(key, value);
  },
  removeItem(key: string) {
    return typeof localStorage === 'undefined'
      ? fallbackAdapter.removeItem(key)
      : createLocalStorageAdapter().removeItem(key);
  }
};

export const usePreferencesStore = defineStore('example-plugin-persistence', {
  state: () => ({ theme: 'dark', compact: false }),
  persist: {
    adapter: safeLocalStorageAdapter,
    key: 'stately:examples:persistence',
    version: 1,
    compression: createLzStringCompression()
  }
});

export const persistenceManager = createStateManager().use(createPersistencePlugin());
