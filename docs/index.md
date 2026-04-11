---
layout: home

title: Stately

titleTemplate: Pinia-style state for Svelte 5

hero:
  name: Stately
  text: Pinia-inspired state for Svelte 5 and SvelteKit
  tagline: Direct-mutation stores with SSR-safe managers and opt-in persistence, history, sync, and async orchestration.
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
---

## What you get

Stately is a Svelte 5 state library for teams that want a small core runtime with explicit plugin-based features.
It is designed for package consumers who want predictable store behavior in both SPA and SSR flows.

## Start here

- Read the [guide](/guide/) for installation, store definitions, SSR patterns, plugins, and release workflows.
- Jump to the [API reference](/reference/api) for the exported runtime surface.
- Browse the packaged examples under `src/lib/examples/` for consumer-facing patterns that match the public API.
