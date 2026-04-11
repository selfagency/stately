---
# stately-c9hk
title: Local quality gates with Husky and lint-staged
status: completed
type: feature
priority: high
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T15:07:12Z
parent: stately-a7ci
---

## Goal

Implement contributor hooks for formatting, linting, svelte-check, and local validation.

## Todo

- [x] Configure pre-commit staged-file hooks.
- [x] Configure pre-push validation hooks.
- [x] Add format and automation-aligned scripts.

## Summary of Changes

- Added staged-file and pre-push Husky hooks with package-script entry points.
- Added and verified hook-aligned scripts for formatting and local validation.
- Documented the split between pre-commit, pre-push, and CI responsibilities while keeping the existing ESLint and Prettier toolchain intact.
