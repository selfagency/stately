---
# stately-p8dd
title: Add docs build and deployment automation
status: completed
type: task
priority: high
created_at: 2026-04-11T00:35:00Z
updated_at: 2026-04-11T15:25:36Z
parent: stately-d2vp
blocked_by:
  - stately-m6vp
  - stately-n7dc
---

## Todo

- [x] Add a docs workflow under `.github/workflows/docs.yml`.
- [x] Integrate VitePress build validation into CI.
- [x] Configure deployment for the generated static docs site.
- [x] Verify docs deployment does not drift from the library release flow.

## Summary of Changes

- Added `.github/workflows/docs.yml` with a pinned GitHub Pages build and deployment flow for the VitePress site.
- Integrated `pnpm run docs:build` into the main CI workflow so documentation build failures are caught in normal validation.
- Configured the site for the custom domain `stately.self.agency`, including a root base path, emitted `CNAME`, and the `gh_pages` deployment environment.
