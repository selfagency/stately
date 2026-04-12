---
# stately-nbdg
title: Before-action guards for $onAction
status: completed
type: feature
priority: high
created_at: 2026-04-12T17:19:32Z
updated_at: 2026-04-12T18:05:28Z
parent: stately-5rkj
---

## Summary of Changes

- Added `before()` guards to `$onAction` hook contexts so actions can be cancelled before execution.
- Ensured cancelled actions skip `after()` and `onError()` callbacks.
- Added tests for cancellation, arg-based guards, and return-value behavior.
