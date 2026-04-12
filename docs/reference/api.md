# Public API reference

This is the hub for the public package exports, starting with `src/lib/index.ts`
and the inspector subpaths.
If you want the "what does this do and when should I use it?" version, use
the topic pages below instead of treating this page like a raw export list.

## Start here

| Topic                                           | What it covers                                             | Best for                                    |
| ----------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| [Core runtime](/reference/core)                 | `defineStore`, managers, store helpers, and Svelte interop | Understanding store lifecycle and core APIs |
| [Plugins and orchestration](/reference/plugins) | Persistence, history, sync, and async plugins              | Learning how advanced features fit together |
| [Inspector](/reference/inspector)               | Dev-only inspector runtime helpers and Vite integration    | Wiring the drawer and Vite plugin           |
| [Persistence helpers](/reference/persistence)   | Storage adapters, compression, and persistence types       | Customizing durable store state             |
| [Public types](/reference/types)                | Store, manager, history, sync, and async contracts         | Adding strong TypeScript inference          |

## What this reference includes

The pages linked above cover the package-root exports plus the inspector
subpath exports, including the store manager helpers, plugin factories,
storage adapters, compression helpers, and public type definitions.

## Read alongside the guide

The reference tells you exactly what each API does.
For step-by-step usage, pair it with the [guide](/guide/) and [examples and recipes](/guide/examples).
