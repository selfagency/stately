---
# stately-a8mc
title: Pick/omit selective field persistence
status: completed
type: feature
priority: high
created_at: 2026-04-12T17:19:32Z
updated_at: 2026-04-12T18:05:28Z
parent: stately-5rkj
---

## Summary of Changes

- Added `pick` and `omit` persistence options for selective field persistence.
- Added validation preventing `pick` and `omit` from being used together.
- Added tests covering persisted shape and rehydration behavior.
