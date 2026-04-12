---
# stately-984d
title: State validation plugin with rollback
status: completed
type: feature
priority: medium
created_at: 2026-04-12T17:19:32Z
updated_at: 2026-04-12T18:05:28Z
parent: stately-5rkj
---

## Summary of Changes

- Added a validation plugin that wraps `$patch` and rolls back invalid mutations.
- Added support for `validate` and `onValidationError` store options.
- Added regression tests covering boolean failures, error messages, rollback, and callback behavior.
