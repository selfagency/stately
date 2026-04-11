---
# stately-vclu
title: Publish stable package exports
status: completed
type: task
priority: high
created_at: 2026-04-11T00:12:55Z
updated_at: 2026-04-11T01:04:32Z
parent: stately-z5mg
blocked_by:
  - stately-ofgb
  - stately-gceq
---

## Todo

- [x] Update `src/lib/index.ts` to export the stable core entry points.
- [x] Export plugin factory entry points without leaking unstable internals.
- [x] Verify the package entry shape matches the intended public API surface.

## Summary of Changes

- Updated `src/lib/index.ts` to export the stable core architecture API for this epic.
- Re-exported the root manager, context helpers, `defineStore()`, `storeToRefs()`, and the public typing layer.
- Kept internal reset helpers out of the public runtime surface.
- Added a targeted entrypoint test to verify the exported runtime API shape.
