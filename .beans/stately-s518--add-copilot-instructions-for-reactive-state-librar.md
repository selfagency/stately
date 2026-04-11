---
# stately-s518
title: Add Copilot instructions for reactive state library development
status: completed
type: task
priority: high
created_at: 2026-04-11T00:23:02Z
updated_at: 2026-04-11T00:29:49Z
parent: stately-2nan
---

## Goal

Create a GitHub Copilot instructions file that guides development of the Svelte 5 reactive state library using the project’s preferred workflows, Svelte 5 best practices, and Pinia-inspired state management conventions.

## Todo

- [x] Review the provided Svelte, Pinia, and state-management references.
- [x] Capture repo-specific workflow requirements (Beans, IDE/MCP-first, validation commands).
- [x] Draft a focused Copilot instructions file for this project.
- [x] Validate the instructions file for clarity and repo alignment.
- [x] Update the bean summary when complete.

## Follow-up

- [x] Revise the guidance to describe a TDD-driven development flow.
- [x] Re-validate the updated instructions file.
- [x] Tighten the guidance so TDD is explicitly required for bug fixes, behavior changes, and public API work.

## Summary of Changes

- Added a new project-level Copilot guidance file at `.github/copilot-instructions.md` tailored to the Svelte 5 reactive state library.
- Included guidance for Pinia-inspired API design, SSR-safe SvelteKit usage, persistence/history/sync/async plugin design, IDE/MCP-first workflows, and Beans task hygiene.
- Revised the guidance to make the development workflow explicitly TDD-first, including a red → green → refactor section and stronger testing expectations for feature work, bug fixes, and public API changes.
- Tightened the wording further so bug fixes, behavior changes, plugin behavior changes, and public API changes are expected to begin with failing tests, with regression coverage treated as required rather than optional.
- Fixed two starter Vitest example imports to use explicit `.js` extensions so the repository validation commands pass under the current NodeNext-style module resolution.
- Validated the updated instructions file successfully.
