---
# stately-thq4
title: Subscriptions and timeline recording
status: completed
type: feature
priority: high
created_at: 2026-04-11T00:12:14Z
updated_at: 2026-04-11T02:33:14Z
parent: stately-5ddl
---

## Goal

Implement state/action subscriptions and internal timeline recording.

## Todo

- [x] Implement subscription lifecycle handling.
- [x] Add internal devtools timeline recorder.

## Summary of Changes

- Added extracted subscription lifecycle handling for mutations and actions.
- Added internal timeline recording for mutation and action events with snapshots and durations.
- Routed the store shell through the subscription and timeline layers with targeted tests.
