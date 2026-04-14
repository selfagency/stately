import { createAsyncPlugin, createStateManager, debounceAction, defineStore, throttleAction } from '../../lib/index.js';

// ---------------------------------------------------------------------------
// Simulated async fetch
// ---------------------------------------------------------------------------

function fakeApiCall(ms: number, fail = false): Promise<string> {
  return new Promise((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error('API error')) : resolve('data loaded')), ms)
  );
}

// ---------------------------------------------------------------------------
// Store definitions
// ---------------------------------------------------------------------------

const _useRestartableStore = defineStore('async-restartable', {
  state: () => ({ value: '', callCount: 0 }),
  actions: {
    async load(ms: number) {
      this.callCount += 1;
      const result = await fakeApiCall(ms);
      this.value = result;
      return result;
    }
  }
});

const _useDropStore = defineStore('async-drop', {
  state: () => ({ value: '', callCount: 0 }),
  actions: {
    async load(ms: number) {
      this.callCount += 1;
      const result = await fakeApiCall(ms);
      this.value = result;
      return result;
    }
  }
});

const _useErrorStore = defineStore('async-error', {
  state: () => ({ value: '', error: '' }),
  actions: {
    async load(fail: boolean) {
      this.error = '';
      try {
        this.value = await fakeApiCall(300, fail);
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e);
        this.value = '';
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------

export type RestartableStore = ReturnType<typeof _useRestartableStore> & {
  $async: { load: { isLoading: boolean; lastSuccessAt: number | undefined; lastFailureAt: number | undefined } };
};

export type DropStore = ReturnType<typeof _useDropStore> & {
  $async: { load: { isLoading: boolean } };
};

export type ErrorStore = ReturnType<typeof _useErrorStore> & {
  $async: { load: { isLoading: boolean } };
};

export interface AsyncDemo {
  restartableStore: RestartableStore;
  dropStore: DropStore;
  errorStore: ErrorStore;

  // debounce / throttle
  debounceLog: string[];
  throttleLog: string[];
  triggerDebounce(): void;
  triggerThrottle(): void;

  destroy(): void;
}

export function createAsyncDemo(): AsyncDemo {
  const restartableManager = createStateManager().use(createAsyncPlugin({ policies: { load: 'restartable' } }));
  const dropManager = createStateManager().use(createAsyncPlugin({ policies: { load: 'drop' } }));
  const errorManager = createStateManager().use(createAsyncPlugin());

  const restartableStore = _useRestartableStore(restartableManager) as RestartableStore;
  const dropStore = _useDropStore(dropManager) as DropStore;
  const errorStore = _useErrorStore(errorManager) as ErrorStore;

  const debounceLog: string[] = $state([]);
  const throttleLog: string[] = $state([]);

  let debounceCounter = 0;
  const debouncedFn = debounceAction(() => {
    debounceCounter += 1;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    debounceLog.unshift(`fired #${debounceCounter} at ${new Date().toLocaleTimeString()}`);
    if (debounceLog.length > 5) debounceLog.pop();
  }, 500);

  let throttleCounter = 0;
  const throttledFn = throttleAction(() => {
    throttleCounter += 1;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    throttleLog.unshift(`fired #${throttleCounter} at ${new Date().toLocaleTimeString()}`);
    if (throttleLog.length > 5) throttleLog.pop();
  }, 1000);

  return {
    restartableStore,
    dropStore,
    errorStore,
    debounceLog,
    throttleLog,
    triggerDebounce() {
      debouncedFn();
    },
    triggerThrottle() {
      throttledFn();
    },
    destroy() {
      debouncedFn.cancel();
      throttledFn.cancel();
      restartableStore.$dispose();
      dropStore.$dispose();
      errorStore.$dispose();
    }
  };
}
