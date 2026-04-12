---
# stately-uq27
title: TTL expiration for persisted state
status: completed
type: feature
priority: medium
created_at: 2026-04-12T17:19:32Z
updated_at: 2026-04-12T18:05:28Z
parent: stately-5rkj
---

## Summary of Changes

- Added `ttl` persistence support using a timestamp envelope around persisted payloads.
- Skipped rehydration when persisted state is expired while keeping non-TTL stores backward compatible.
- Added tests for fresh, expired, and non-TTL payload handling.
