---
# stately-ck57
title: Add typed plugin options
status: completed
type: task
priority: normal
created_at: 2026-04-11T00:13:25Z
updated_at: 2026-04-11T04:14:42Z
parent: stately-3zld
blocked_by:
  - stately-f700
  - stately-ffo3
---

## Todo

- [x] Extend `src/lib/pinia-like/plugin-options.ts` with `persist` config types.
- [x] Extend the same module with `history` config types.
- [x] Ensure both option-store and setup-store definitions accept the new options.

## Summary of Changes

- Added typed plugin option definitions for `persist` and `history`.
- Added a setup-store definition object shape so setup stores can carry plugin options.
- Exported the new plugin option types and plugin entry points from the package root.
- Added definition and entrypoint coverage proving both store syntaxes accept the new options.
