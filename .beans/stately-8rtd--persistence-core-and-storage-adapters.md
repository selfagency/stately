---
# stately-8rtd
title: Persistence core and storage adapters
status: completed
type: feature
priority: critical
created_at: 2026-04-11T00:12:29Z
updated_at: 2026-04-11T04:06:11Z
parent: stately-ruuz
---

## Goal

Implement persistence plugin core, storage adapters, and optional compression.

## Todo

- [x] Implement persistence plugin core.
- [x] Implement local, session, memory, and IndexedDB adapters.
- [x] Add optional LZ compression support.

## Summary of Changes

- Added the persistence plugin core with safe serialization, migration-aware deserialization, and store rehydration/flush controls.
- Added memory, localStorage, sessionStorage, and IndexedDB adapters.
- Added opt-in `lz-string` compression and integrated it into persistence flush/rehydration behavior.
