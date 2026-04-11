# Troubleshooting

## I lose reactivity after destructuring a store

Use `storeToRefs()` when you need destructured reactive properties.
Plain JavaScript destructuring snapshots the current value and breaks future updates.

## My SSR store leaks across requests

Do not rely on `getDefaultStateManager()` on the server.
Create a fresh manager per request and provide it through Svelte context.

## Persistence keeps overwriting restored state

Pause persistence while you make local exploratory changes, then rehydrate or resume explicitly.
The showcase page demonstrates the save, pause, restore, and clear flows.

## Time travel seems to skip sync or persistence side effects

That is intentional.
Replay mode suppresses those feedback loops so historical snapshot navigation stays deterministic.
