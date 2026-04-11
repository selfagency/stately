# Public API reference

This is the hub for the public exports from `src/lib/index.ts`.
If you want the "what does this do and when should I use it?" version, use
the topic pages below instead of treating this page like a raw export list.

## Start here

| Topic                                           | What it covers                                                                         | Best for                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Core runtime](/reference/core)                 | `defineStore`, state managers, store helpers, Svelte interop, and external subscribers | Understanding the store lifecycle and the core API surface |
| [Plugins and orchestration](/reference/plugins) | Persistence, history, sync, and async plugins                                          | Learning how the advanced features fit together            |
| [Persistence helpers](/reference/persistence)   | Storage adapters, compression, and persistence types                                   | Building or customizing durable store state                |
| [Public types](/reference/types)                | Store, manager, history, sync, and async type contracts                                | Adding strong TypeScript inference or writing plugins      |

## What this reference includes

The pages linked above cover every package-root export in `src/lib/index.ts`,
including the store manager helpers, plugin factories, storage adapters,
compression helpers, and public type definitions.

## Read alongside the guide

The reference tells you exactly what each API does.
For step-by-step usage, pair it with the [guide](/guide/) and [examples and recipes](/guide/examples).
