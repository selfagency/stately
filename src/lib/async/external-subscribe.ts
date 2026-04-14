import { createSubscriber } from 'svelte/reactivity';

export function createExternalSubscriber<Value>(config: {
  getSnapshot: () => Value;
  subscribe: (update: () => void) => (() => void) | void;
}) {
  let cleanup: (() => void) | undefined;
  const subscribe = createSubscriber((update) => {
    cleanup?.();
    cleanup = config.subscribe(update) ?? undefined;
    return () => {
      cleanup?.();
      cleanup = undefined;
    };
  });

  return {
    get current(): Value {
      subscribe();
      return config.getSnapshot();
    },
    unsubscribe() {
      cleanup?.();
      cleanup = undefined;
    }
  };
}
