---
# stately-j4pp
title: Configure pre-push validation hooks
status: completed
type: task
priority: high
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T14:55:33Z
parent: stately-c9hk
blocked_by:
  - stately-h3pc
---

## Todo

- [x] Add `.husky/pre-push`.
- [x] Run `svelte-check` before push.
- [x] Run the appropriate local test command before push.
- [x] Document the intended split between pre-commit, pre-push, and CI checks.

## Summary of Changes

- Added `.husky/pre-push` and made it executable.
- Wired pre-push validation to `pnpm run check` and `pnpm run test` so Svelte type checks and the relevant test suite run before push.
- Added `CONTRIBUTING.md` to document the split between pre-commit, pre-push, and CI responsibilities.
