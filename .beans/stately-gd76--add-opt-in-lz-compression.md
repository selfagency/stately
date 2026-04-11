---
# stately-gd76
title: Add opt-in LZ compression
status: completed
type: task
priority: normal
created_at: 2026-04-11T00:13:15Z
updated_at: 2026-04-11T04:06:11Z
parent: stately-8rtd
blocked_by:
  - stately-l79m
---

## Todo

- [x] Add `lz-string` integration under `src/lib/persistence/compression/lz-string.ts`.
- [x] Wire compression as an opt-in persist option.
- [x] Verify compressed payloads round-trip correctly.
- [x] Reject unsupported or invalid compressed input safely.

## Summary of Changes

- Added an `lz-string` compression adapter with explicit safety marking for persisted payloads.
- Wired compression into persistence flush and rehydration as an opt-in persist option.
- Added focused tests covering round-trip behavior and safe rejection of unsupported compressed input.
