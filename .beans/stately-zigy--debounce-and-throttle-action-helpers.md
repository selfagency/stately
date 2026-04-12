---
# stately-zigy
title: Debounce and throttle action helpers
status: completed
type: feature
priority: medium
created_at: 2026-04-12T17:19:32Z
updated_at: 2026-04-12T18:05:28Z
parent: stately-5rkj
---

## Summary of Changes

- Added reusable `debounceAction()` and `throttleAction()` helpers with `cancel()` support.
- Added focused tests covering delayed execution, trailing invocation, and cancellation behavior.
