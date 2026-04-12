---
# stately-xlsg
title: Implement code review remediation plan
status: completed
type: task
priority: high
branch: fix/xlsg-implement-code-review-remediation-plan
created_at: 2026-04-12T21:34:27Z
updated_at: 2026-04-12T21:34:27Z
---

## Todo

- [x] Harden release workflow tarball verification
- [x] Capture CI build diagnostics as artifacts
- [x] Remove unnecessary reactive FSM map overhead
- [x] Make inspector Vite client detection more resilient
- [x] Clarify store-shell and SSR docs around reactivity constraints

## Summary of Changes

- Added build diagnostics upload in CI and tarball integrity checks in the release workflow.
- Hardened inspector Vite client detection and added regression coverage for pnpm-style ids.
- Documented explicit runtime subscription boundaries and direct-mutation suppression behavior.
- Clarified SSR guidance for `storeToRefs()` usage and recorded the work branch in bean metadata.
