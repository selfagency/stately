# Troubleshooting

Even the finest state systems encounter turbulence from time to time. This page is organized by symptom, not by pride.

## I lose reactivity after destructuring a store

Use `storeToRefs()` when you need destructured reactive properties.
Plain JavaScript destructuring snapshots the current value and breaks future updates.

## My SSR store leaks across requests

Do not rely on `getDefaultStateManager()` on the server.
Create a fresh manager per request and provide it through Svelte context.

How to verify the cause:

- the store is created from a module-level singleton
- the server path calls `getDefaultStateManager()`
- state appears to survive between unrelated requests

Fix:

- create the manager in a layout or component `<script>` block
- call `initializeStateManagerContext()` there
- instantiate stores from `getStateManager()` inside the request-owned tree

## Persistence keeps overwriting restored state

Pause persistence while you make local exploratory changes, then rehydrate or resume explicitly.
The showcase page demonstrates the save, pause, restore, and clear flows.

If a store mutates very frequently, add `debounce` to reduce write pressure.

## Time travel seems to skip sync or persistence side effects

That is intentional.
Replay mode suppresses those feedback loops so historical snapshot navigation stays deterministic.

What to do instead:

- treat replay as inspection, not as a durable write
- leave replay mode before saving or syncing current state
- use normal live mutations after replay when you want persistence or sync to run

## My async action does not cancel

If the async plugin tracks the action but cancellation does nothing, check the
action signature.

`createAsyncPlugin()` only provides an `AbortSignal` when you configure
`injectSignal` and place the signal where your action expects it.

## My subscription fires too often

Use `$subscribe(..., { select, equalityFn })` when the integration only cares
about one slice of state.

Without `select`, the subscription fires on every mutation.
