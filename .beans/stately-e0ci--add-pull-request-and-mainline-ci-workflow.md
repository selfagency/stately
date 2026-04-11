---
# stately-e0ci
title: "Add pull-request and mainline CI workflow"
status: in-progress
type: task
priority: critical
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T14:37:26Z
parent: stately-b8rl
branch: feat/a7ci-ci-hooks-docs
blocked_by:
    - stately-vclu
---

## Todo

- [ ] Create `.github/workflows/ci.yml`.
- [ ] Run install plus `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` in CI.
- [ ] Add package-quality verification through the existing package scripts.
- [ ] Ensure the workflow runs on pull requests and protected branches.
