---
# stately-ai04
title: Refresh documentation surface for full feature coverage
status: completed
type: task
priority: high
created_at: 2026-04-12T20:03:04Z
updated_at: 2026-04-12T20:25:22Z
---

## Todo

- [x] Redesign docs navigation
- [x] Rewrite README overview
- [x] Rewrite contributor guide
- [x] Add missing feature docs
- [x] Tighten SSR guidance
- [x] Update links and cross-references
- [x] Build and validate docs

## Working branch

- `feat/ai04-refresh-documentation-surface`

## Summary of Changes

- Rewrote `README.md` as a stronger product overview with clearer routing to the guide and reference docs.
- Rebuilt `CONTRIBUTING.md` around the first-contribution journey and maintainer-managed internal workflows.
- Refreshed the docs landing pages and VitePress navigation to surface FSM, validation, and SvelteKit data-loading guidance.
- Added new guide/reference pages for finite state machines and validation, plus a new SvelteKit data-loading guide.
- Expanded core, plugin, persistence, examples, and troubleshooting docs to cover selective subscriptions, action guards, sync ordering, history batching, TTL persistence, and async cancellation.
- Verified the docs with `pnpm run docs:build`, `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`.

- Refined `README.md` again to emphasize the inspector, clarify the library for readers unfamiliar with Pinia, remove low-value maintainer-oriented sections, and shift the voice toward a more confidently regal Stately tone.
