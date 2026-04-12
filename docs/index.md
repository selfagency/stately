---
layout: home

title: Stately

titleTemplate: Pinia-style state for Svelte 5

hero:
  name: Stately
  text: Pinia-inspired state for Svelte 5 and SvelteKit
  tagline: Direct-mutation stores with SSR-safe managers, explicit workflows, and opt-in plugins — from persistence to finite state machines.
  image:
    src: /stately.svg
    alt: Stately logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/
    - theme: alt
      text: API reference
      link: /reference/api
    - theme: alt
      text: GitHub
      link: https://github.com/selfagency/stately

features:
  - title: Familiar store ergonomics
    details: Use `defineStore()` with option stores or setup stores while keeping direct mutation and Pinia-like helper names.
  - title: SSR-safe by default
    details: Create request-scoped managers and provide them through Svelte context instead of leaking singleton state on the server.
  - title: Advanced flows stay opt-in
    details: Add persistence, history, time travel, multi-tab sync, and async request control only where a store needs them.
  - title: Explicit workflow state
    details: Model state machines with `createFsmPlugin()` when your store has real states, real transitions, and no patience for boolean soup.
  - title: Guardrails for live data
    details: Add validation, selective subscriptions, action hooks, and cancellation-aware async orchestration without rewriting your store model.
  - title: Developer tooling included
    details: Use the inspector drawer, Vite integration, and typed helper exports to understand what your stores are doing while they are doing it.
---

## What you get

Stately is a Svelte 5 state library for teams who want a small, composed core runtime with explicit plugin-based features.
It is designed for package consumers who want predictable store behavior in
both SPA and SSR flows, with enough structure to model real app workflows —
without ceremony where none is warranted, and with full ceremony where it genuinely is.

The documentation is organized so you can move from learning the API to
applying it in real apps:

- The [guide](/guide/) explains the recommended patterns.
- The [reference](/reference/api) breaks the public API into focused topics.
- The [examples](/guide/examples) page shows persistence, history, sync, async orchestration, and store composition in practice.

## Feature map

Stately includes:

- option stores and setup stores through `defineStore()`
- request-scoped managers for SSR-safe SvelteKit usage
- persistence with storage adapters, migrations, TTL expiry, and optional compression
- history and time travel with batch recording
- finite state machines with `send()`, `matches()`, and `can()`
- multi-tab sync with transport abstractions and deterministic conflict handling
- async loading, cancellation, and concurrency policies
- validation that can reject and roll back invalid patches
- developer tooling such as the inspector drawer and Vite plugin

## Start here

- Read the [guide](/guide/) for installation, store definitions, SSR patterns, plugins, and release workflows.
- Jump to [Define stores](/guide/define-store) if you want the fastest route to your first useful store.
- Read [Plugins](/guide/plugins) when you need persistence, history, FSMs,
  sync, validation, async orchestration, or the inspector.
- Use [SSR and SvelteKit](/guide/ssr-and-sveltekit) and
  [SvelteKit data loading](/guide/sveltekit-data-loading) if the app renders on
  the server.
- Jump to the [API reference](/reference/api) for the exported runtime surface.
- Browse the packaged examples under `src/lib/examples/` and the
  [examples page](/guide/examples) for consumer-facing patterns that match the
  public API.
