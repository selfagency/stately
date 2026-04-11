---
# stately-qwur
title: 'Implement stately inspector vite plugin'
status: in-progress
type: feature
priority: high
created_at: 2026-04-11T19:19:57Z
updated_at: 2026-04-11T19:19:57Z
branch: feature/qwur-stately-inspector-vite-plugin
---

## Todo

- [x] Phase 1: add failing runtime registration and disposal tests
- [x] Phase 1: implement inspector hook, types, store adapter, and store-shell wiring
- [x] Phase 1: run targeted runtime tests and commit when green
- [x] Phase 2: add failing drawer and live-update tests
- [x] Phase 2: implement drawer state, formatter, component, and bootstrap client
- [x] Phase 2: run targeted browser tests and commit when green
- [ ] Phase 3: add failing Vite plugin and virtual-module tests
- [ ] Phase 3: implement virtual ids, loader, and Vite dev-client transform
- [ ] Phase 3: run targeted Vite/plugin tests and commit when green
- [ ] Phase 4: add exports, dogfood in vite config, and write docs
- [ ] Phase 4: run build and docs checks and commit when green
- [ ] Phase 5: add final regression coverage for startup capture, no-history stores, and replay controls
- [ ] Phase 5: run check, lint, test, build, and docs:build
- [ ] Open PR and record PR number

## Summary of Changes

- Added the phase 1 runtime inspector bridge: global hook, store adapter, hidden store-shell registration, and disposal cleanup.
- Added regression coverage for store registration, live snapshot reads, inert no-hook behavior, and unregister-on-dispose.
- Added the phase 2 drawer UI, formatter, reactive drawer state, and client bootstrap.
- Added browser coverage for live state updates and history replay controls in the drawer.
