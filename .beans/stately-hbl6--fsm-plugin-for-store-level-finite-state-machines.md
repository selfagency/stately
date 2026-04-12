---
# stately-hbl6
title: FSM plugin for store-level finite state machines
status: completed
type: feature
priority: high
created_at: 2026-04-12T17:19:32Z
updated_at: 2026-04-12T18:05:28Z
parent: stately-5rkj
---

## Summary of Changes

- Added a new FSM plugin with typed controller helpers (`$fsm.current`, `send`, `matches`, `can`).
- Added runtime support for entry/exit hooks and history-aware FSM state synchronization.
- Added regression coverage for transitions, hooks, computed targets, and history integration.
