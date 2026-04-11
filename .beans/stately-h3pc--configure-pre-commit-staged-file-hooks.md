---
# stately-h3pc
title: Configure pre-commit staged-file hooks
status: completed
type: task
priority: high
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T14:53:46Z
parent: stately-c9hk
blocked_by:
    - stately-e0ci
---

## Todo

- [x] Configure `lint-staged` patterns for staged file validation.
- [x] Add `.husky/pre-commit`.
- [x] Run Biome format/check and ESLint in the staged-file flow.
- [x] Keep pre-commit feedback fast enough for normal contributor use.

## Summary of Changes

- Added `.lintstagedrc.json` with staged-file validation focused on ESLint and Prettier for the repository's existing toolchain.
- Added `.husky/pre-commit` and made it executable.
- Kept the pre-commit flow limited to staged files so feedback stays fast for normal contributor use.
