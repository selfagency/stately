---
# stately-cnbn
title: Selective subscriptions with selector function
status: completed
type: feature
priority: high
created_at: 2026-04-12T17:19:32Z
updated_at: 2026-04-12T18:05:28Z
parent: stately-5rkj
---

## Summary of Changes

- Extended `$subscribe` with selector-based filtering via `select` and optional `equalityFn`.
- Preserved existing subscription behavior when no selector is provided.
- Added tests covering filtered subscriptions, custom equality, and `$patch` integration.
