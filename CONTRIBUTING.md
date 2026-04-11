# Contributing to Stately

## Local quality gates

Stately uses three layers of validation so contributors get fast feedback locally without duplicating every expensive check on every save.

### Pre-commit

The pre-commit hook only inspects staged files.
It runs `lint-staged`, which applies ESLint fixes to staged source files and Prettier formatting to staged source and markdown/config files.

### Pre-push

The pre-push hook runs the heavier local validation steps before code leaves your machine:

- `pnpm run check`
- `pnpm run test`

This keeps type and test failures local while leaving the full packaging and release checks to CI.

### CI

GitHub Actions remains the final source of truth.
CI reruns `check`, `lint`, `test`, and `build`, and the release workflow repeats those validations before versioning or publishing.
