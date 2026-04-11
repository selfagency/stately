---
# stately-k5fs
title: Add format and automation-aligned scripts
status: completed
type: task
priority: high
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T15:07:12Z
parent: stately-c9hk
blocked_by:
  - stately-h3pc
  - stately-j4pp
---

## Todo

- [x] Add `format` and `format:check` scripts to `package.json`.
- [x] Align hook commands with package-manager scripts so local and CI behavior match.
- [x] Add or refine Biome configuration if needed for formatting and checks.
- [x] Verify hooks and scripts do not conflict with ESLint or Svelte tooling.

## Summary of Changes

- Added the missing hook-aligned scripts to `package.json`, including `format:check`, `validate:staged`, and `validate:pre-push`.
- Updated Husky hooks to call package scripts instead of hard-coding tool commands.
- Kept `.lintstagedrc.json` as the single source of truth for staged-file validation and verified the commands work with the existing ESLint and Prettier toolchain.
- No Biome configuration was added because the repository’s active formatting and linting stack is ESLint plus Prettier.
