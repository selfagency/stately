---
# stately-qwur
title: 'Implement stately inspector vite plugin'
status: in-progress
type: feature
priority: high
created_at: 2026-04-11T19:19:57Z
updated_at: 2026-04-11T19:55:14Z
branch: feature/qwur-stately-inspector-vite-plugin
pr: 10
---

## Todo

- [x] Phase 1: add failing runtime registration and disposal tests
- [x] Phase 1: implement inspector hook, types, store adapter, and store-shell wiring
- [x] Phase 1: run targeted runtime tests and commit when green
- [x] Phase 2: add failing drawer and live-update tests
- [x] Phase 2: implement drawer state, formatter, component, and bootstrap client
- [x] Phase 2: run targeted browser tests and commit when green
- [x] Phase 3: add failing Vite plugin and virtual-module tests
- [x] Phase 3: implement virtual ids, loader, and Vite dev-client transform
- [x] Phase 3: run targeted Vite/plugin tests and commit when green
- [x] Phase 4: add exports, dogfood in vite config, and write docs
- [x] Phase 4: run build and docs checks and commit when green
- [x] Phase 5: add final regression coverage for startup capture, no-history stores, and replay controls
- [x] Phase 5: run check, lint, test, build, and docs:build
- [x] Open PR and record PR number
- [x] Add failing demo-build inspector coverage
- [x] Make the showcase build include both state functionality and the inspector
- [x] Run targeted tests plus build validation and update PR #10

## Summary of Changes

- Added the phase 1 runtime inspector bridge: global hook, store adapter, hidden store-shell registration, and disposal cleanup.
- Added regression coverage for store registration, live snapshot reads, inert no-hook behavior, and unregister-on-dispose.
- Added the phase 2 drawer UI, formatter, reactive drawer state, and client bootstrap.
- Added browser coverage for live state updates, no-history fallback UI, history replay controls, and bootstrap mount/dispose behavior.
- Added the phase 3 Vite plugin, virtual ids, runtime loader, and dev-client transform coverage.
- Added public `./inspector` and `./inspector/vite` package exports, local dev dogfooding in `vite.config.ts`, and dedicated guide/reference documentation.
- Added showcase coverage proving the built demo includes the inspector and that inspector state stays in sync with the showcase store.
- Wired the showcase page to install the inspector hook before client-side store creation and render the drawer after mount so production preview builds support e2e testing.
- Verified the updated demo flow with `pnpm run check`, targeted browser tests for the showcase and inspector, and `pnpm run build`.
- Opened PR #10: https://github.com/selfagency/stately/pull/10
