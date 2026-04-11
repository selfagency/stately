---
# stately-3rjd
title: Store shell and commit batching
status: completed
type: feature
priority: critical
created_at: 2026-04-11T00:12:14Z
updated_at: 2026-04-11T02:23:10Z
parent: stately-5ddl
---

## Goal
Implement store instance helpers and grouped commit batching.

## Todo

- [x] Implement store shell helpers.
- [x] Implement grouped mutation queue.

## Summary of Changes

- Added the common store shell helper with `$state`, `$patch`, `$reset`, `$subscribe`, `$onAction`, and `$dispose`.
- Added grouped mutation commit handling with deterministic patch-function batching.
- Routed runtime mutations through the shared shell and queue layers with targeted tests.
