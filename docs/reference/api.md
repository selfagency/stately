# Public API reference

This is the catalogue of the public package exports, starting with `src/lib/index.ts`,
the package root, and the inspector subpaths.

Use this page to decide which reference page answers your question fastest.
If you want the "when should I use this?" version, pair it with the [guide](/guide/).

## Start here

- [Core runtime](/reference/core)
  - Covers `defineStore`, managers, store helpers, and Svelte interop
  - Best for understanding the store lifecycle and core APIs
- [Plugins and orchestration](/reference/plugins)
  - Covers persistence, history, sync, and async plugins
  - Best for understanding how advanced features fit together
- [Finite state machines](/reference/fsm)
  - Covers `createFsmPlugin()`, `fsm` definitions, and `$fsm`
  - Best for modeling explicit workflow state
- [Validation](/reference/validation)
  - Covers `createValidationPlugin()`, validate hooks, and rollback behavior
  - Best for rejecting invalid state changes safely
- [Inspector](/reference/inspector)
  - Covers the dev-only inspector runtime helpers and Vite integration
  - Best for wiring the drawer and Vite plugin
- [Persistence helpers](/reference/persistence)
  - Covers storage adapters, compression, and persistence types
  - Best for customizing durable store state
- [Public types](/reference/types)
  - Covers store, manager, history, sync, and async contracts
  - Best for keeping strong TypeScript inference end to end

## What this reference includes

The pages linked above cover the package-root exports plus the inspector subpath exports, including:

- store definition and manager helpers
- plugin factories
- FSM and validation APIs
- storage adapters and compression helpers
- public store, sync, history, async, and persistence types

## Read alongside the guide

The reference tells you exactly what each API does.
For step-by-step usage, pair it with the [guide](/guide/) and [examples and recipes](/guide/examples).
