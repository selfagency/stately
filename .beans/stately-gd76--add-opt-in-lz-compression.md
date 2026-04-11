---
# stately-gd76
title: Add opt-in LZ compression
status: in-progress
type: task
priority: normal
created_at: 2026-04-11T00:13:15Z
updated_at: 2026-04-11T04:03:04Z
parent: stately-8rtd
blocked_by:
    - stately-l79m
---

## Todo

- [ ] Add `lz-string` integration under `src/lib/persistence/compression/lz-string.ts`.
- [ ] Wire compression as an opt-in persist option.
- [ ] Verify compressed payloads round-trip correctly.
- [ ] Reject unsupported or invalid compressed input safely.
