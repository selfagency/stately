---
# stately-5rkj
title: Adopt patterns from external Svelte state libraries
status: completed
type: epic
priority: high
created_at: 2026-04-12T17:19:22Z
updated_at: 2026-04-12T18:05:28Z
---

## Summary of Changes

- Implemented seven feature slices inspired by external Svelte state libraries: FSM plugin, selective subscriptions, before-action guards, selective persistence, TTL persistence, action rate-limiting helpers, and validation rollback.
- Exported the new public APIs from `src/lib/index.ts`.
- Verified the full change set with `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`.
