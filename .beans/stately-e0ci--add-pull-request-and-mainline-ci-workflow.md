---
# stately-e0ci
title: Add pull-request and mainline CI workflow
status: completed
type: task
priority: critical
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T14:44:54Z
parent: stately-b8rl
blocked_by:
    - stately-vclu
---

## Todo

- [x] Create `.github/workflows/ci.yml`.
- [x] Run install plus `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` in CI.
- [x] Add package-quality verification through the existing package scripts.
- [x] Ensure the workflow runs on pull requests and protected branches.

## Summary of Changes

- Added `.github/workflows/ci.yml` with pull request, main-branch, and manual triggers.
- Pinned the GitHub-owned actions to immutable SHAs and used Node 24 with pnpm caching.
- Wired CI to run the repository's existing `check`, `lint`, `test`, and `build` scripts so package-quality verification stays aligned with local validation.
