---
# stately-5ddl
title: Store runtime and mutation pipeline
status: completed
type: epic
priority: critical
created_at: 2026-04-11T00:11:56Z
updated_at: 2026-04-11T02:33:14Z
parent: stately-pm7k
---

## Goal

Build the runtime for state, getters, actions, batching, subscriptions, and timeline recording.

## Todo

- [x] Implement option and setup store instantiation.
- [x] Implement store shell helpers and grouped commit batching.
- [x] Implement subscriptions and internal timeline recording.

## Summary of Changes

- Added dedicated option and setup store runtime modules.
- Added common store shell helpers, grouped mutation batching, subscription lifecycle handling, and internal timeline recording.
- Added focused runtime coverage for option/setup stores, shell helpers, batching, subscriptions, and timeline behavior.
