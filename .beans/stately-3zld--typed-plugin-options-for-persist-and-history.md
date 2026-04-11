---
# stately-3zld
title: Typed plugin options for persist and history
status: completed
type: feature
priority: normal
created_at: 2026-04-11T00:12:29Z
updated_at: 2026-04-11T04:14:42Z
parent: stately-ruuz
---

## Goal

Expose typed store options for persistence and history plugins.

## Todo

- [x] Add typed `persist` options.
- [x] Add typed `history` options.
- [x] Ensure both store syntaxes accept plugin options.

## Summary of Changes

- Added typed `persist` and `history` plugin options through module augmentation.
- Enabled both option-store and setup-store definition forms to carry plugin options.
- Exported the new option types and plugin entry points from the public package surface.
