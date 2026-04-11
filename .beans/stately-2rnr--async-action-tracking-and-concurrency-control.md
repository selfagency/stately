---
# stately-2rnr
title: Async action tracking and concurrency control
status: completed
type: feature
priority: critical
created_at: 2026-04-11T00:12:33Z
updated_at: 2026-04-11T03:33:21Z
parent: stately-uu8l
---

## Goal

Implement async action tracking, concurrency policies, cancellation, and external event bridges.

## Todo

- [x] Add async plugin and tracked action wrapper.
- [x] Implement concurrency policy engine.
- [x] Add abort and stale-result protection.
- [x] Add external subscriber bridge helpers.

## Summary of Changes

- Added async tracking and plugin augmentation for per-action metadata.
- Added concurrency policies, request cancellation, and stale-result protection.
- Added `createSubscriber`-based external subscription bridging utilities.
- Exported the new sync/async entry points through the package root and added focused tests.
