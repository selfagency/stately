# Copilot instructions for the Svelte 5 reactive state library

This repository is building a **Svelte 5 reactive state library** with a **Pinia-inspired API**.

The target product includes:

- Persistence: `localStorage`, `sessionStorage`, IndexedDB, memory storage, optional LZ compression
- History: undo/redo, batch operations, time-travel debugging
- Sync: multi-tab synchronization via `storage` events and `BroadcastChannel`
- Async: loading/error tracking, request cancellation, concurrency control

The library must feel familiar to Pinia users while remaining idiomatic to **Svelte 5 runes** and **SvelteKit SSR safety**.

## Product goals

- Prefer a public API centered on `defineStore()` and `use...Store()` semantics.
- Support both:
  - **option stores**: `state`, `getters`, `actions`
  - **setup stores**: store factories that return reactive state, derived values, and actions
- Expose Pinia-like store helpers where appropriate, including:
  - `$id`
  - `$state`
  - `$patch`
  - `$reset`
  - `$subscribe`
  - `$onAction`
  - `$dispose`
- Keep the **core runtime tree-shakable**.
- Keep persistence, history, sync, and async orchestration **opt-in**, plugin-style features.
- Preserve **strong TypeScript inference** across state, getters, actions, plugin options, and plugin-added properties.

## Svelte 5 architecture rules

- Use **Svelte 5 runes** as the primary reactivity model.
- Use `$state` for mutable reactive state.
- Use `$derived` or `$derived.by` for computed values.
- Treat `$effect` as an **escape hatch** for external side effects only.
- Do **not** use `$effect` to synchronize derived state that should be expressed as `$derived`.
- Use `$state.snapshot()` when serializing state for persistence, history snapshots, sync payloads, or external tooling.
- Use `createSubscriber` from `svelte/reactivity` when bridging external event systems into reactivity.
- Use Svelte reactive built-ins such as `SvelteMap`, `SvelteSet`, `SvelteURL`, and `SvelteDate` when reactive collections or browser-native state wrappers are needed.
- Be careful with destructuring: raw destructuring can break reactivity. If destructuring store state is required, provide and use a dedicated helper such as `storeToRefs()`.
- Prefer classes, accessors, or stable wrappers over leaky reactive implementation details.

## File and module conventions

- Any internal module that uses runes such as `$state`, `$derived`, or `$effect` must live in a **`.svelte.ts`** file.
- Plain **`.ts`** files should only be used for helpers that do **not** rely on runes.
- Keep public exports deliberate and stable through `src/lib/index.ts`.
- Place the library runtime under `src/lib/`.
- Use `src/routes/+page.svelte` only as a showcase/demo surface, not as the source of reusable library logic.

## Pinia-inspired API guidance

When designing or extending the API, prefer Pinia-like ergonomics:

- `defineStore(id, options)` for option stores
- `defineStore(id, setup)` for setup stores
- Store names and ids should be stable, unique, and devtools-friendly.
- Store instances should expose state/getters/actions directly on the store object.
- Provide a `storeToRefs()`-style escape hatch for safe destructuring of reactive properties.
- Support direct mutation and `$patch(...)`, but route both through the same mutation pipeline so subscriptions, history, sync, persistence, and timelines stay coherent.
- Model plugin registration with a root manager pattern such as `createStateManager().use(plugin)`.
- Plugins should be able to:
  - augment stores
  - add typed options
  - wrap actions
  - register subscriptions and side effects
  - integrate with testing and SSR-safe store creation

## SSR and SvelteKit safety rules

- **Never** rely on shared mutable singleton state on the server by default.
- In SvelteKit, recommended store-manager usage must be **request-scoped**.
- Prefer root-manager instances attached through **Svelte context** for SSR-safe usage.
- Any singleton convenience API must be clearly documented as **SPA-only**.
- Do **not** write to shared global state from `load` functions.
- Do **not** introduce side effects in `load` functions.
- When work touches SSR-sensitive areas, explicitly document whether the pattern is:
  - SSR-safe
  - SPA-only
  - browser-only

## State-management implementation guidance

### Core runtime

- Keep the runtime small, explicit, and testable.
- Separate state mutation from reactions to state mutation.
- Treat mutation recording as a first-class concern.
- Prefer deterministic flows over implicit magic.
- Store subscriptions and action hooks must have clear lifecycle and cleanup behavior.

### Persistence

- Keep persistence opt-in.
- Support adapters for:
  - `localStorage`
  - `sessionStorage`
  - IndexedDB
  - in-memory storage
- Compression must remain optional.
- Persisted payloads must be treated as **untrusted input**.
- Validate and migrate persisted payloads defensively.
- Never evaluate persisted data.

### History and time travel

- History should be based on explicit snapshots or well-defined mutation records.
- Use `$state.snapshot()` for replayable history state.
- Batch operations should produce a single logical history entry when appropriate.
- Time-travel replay must avoid creating persistence or sync feedback loops.
- Keep replay mode explicit and suppress side effects as needed.

### Multi-tab sync

- Sync should use `BroadcastChannel` when available and fallback to `storage` events when needed.
- Validate inbound sync messages before patching live state.
- Ignore self-originated messages.
- Use a documented conflict policy such as last-write-wins unless a stronger policy is intentionally introduced.

### Async orchestration

- Async helpers should expose loading and error state automatically.
- Support request cancellation with `AbortController`.
- Protect against stale async results overwriting newer state.
- Concurrency control should be explicit and typed.
- Prefer named policies such as:
  - `parallel`
  - `restartable`
  - `drop`
  - `enqueue`
  - `dedupe`

## TypeScript expectations

- Maintain strict typing and inference.
- Avoid `any` unless there is no better option and the reason is documented.
- Type plugin augmentation points carefully.
- Keep public API names stable and readable.
- Favor API shapes that give strong editor autocomplete.

## TDD-driven development flow

Follow a **test-driven development** workflow by default.
Treat TDD as the standard delivery path for this repository, not a nice-to-have.

For feature work, bug fixes, and behavioral changes:

1. Start by defining the expected behavior.
2. Write or update a failing test that captures that behavior.
3. Run the smallest relevant test scope and confirm it fails for the right reason.
4. Implement the smallest code change needed to make the test pass.
5. Refactor while keeping the tests green.
6. Run broader validation before considering the work done.

Additional TDD expectations:

- Prefer **red → green → refactor** over writing large implementation slices first.
- Do not start implementation of a bug fix or behavior change until there is a failing test, unless the change is purely non-behavioral documentation or mechanical maintenance.
- When fixing a bug, add a regression test before the fix or in the same change set as the first implementation step.
- When adding a new store capability, start with behavior tests for the public API rather than testing internals first.
- Public API changes must begin with tests that describe the consumer-facing contract.
- Plugin behavior changes must begin with tests that cover observable plugin effects and integration points.
- Keep tests close to user-observable or consumer-observable behavior: store state, getters, actions, subscriptions, persistence behavior, sync behavior, and async orchestration outcomes.
- Use targeted tests during iteration, but do not finish on targeted tests alone.
- If a feature is hard to test, treat that as a design signal and simplify the abstraction where possible.
- If you cannot write a meaningful failing test first, explicitly justify why and choose the smallest possible alternative validation strategy.

## Testing and verification rules

Before considering any issue complete, the expected workflow is:

1. Add or update a failing test first.
2. Implement the smallest change that makes the test pass.
3. Refactor safely with tests green.
4. Run the full validation workflow:

- `pnpm run check`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`

Additional expectations:

- Prefer writing the smallest failing test that proves the requirement.
- Bug fixes are not complete without regression coverage.
- Public API changes are not complete without tests that describe the new or changed contract.
- Run targeted tests during development, then run the full validation set before closing the issue.
- Prefer behavior-focused tests over implementation-detail tests.
- Add or update tests when changing store semantics, plugin behavior, persistence, history, sync, or async orchestration.
- If a change affects SSR safety, add coverage or explicit validation for the SSR-safe path.
- If a change affects browser-only features such as storage, IndexedDB, BroadcastChannel, or abort behavior, test the feature detection and fallback behavior.
- Do not treat code as complete merely because it builds; the relevant tests must demonstrate the intended behavior.
- For public API changes, prefer starting with unit tests for the library surface and then add showcase or browser coverage when the behavior is user-facing.
- Do not close an issue with only build success or manual reasoning if the behavior can and should be tested automatically.

## Tooling workflow

Prefer **IDE tools, built-in editor operations, chat participants, and MCP-backed workflows** over raw shell commands.

Use this priority order whenever possible:

1. VS Code UI / editor operations
2. IDE-integrated chat participants and commands
3. MCP tools
4. Shell commands as a last resort

Specific expectations:

- Prefer file editing tools over shell-based file rewrites.
- Do not use shell heredocs or shell redirection to create or edit files.
- Prefer official docs and MCP-backed documentation sources over guesswork.
- Prefer structured tool-based inspection and search over ad hoc terminal parsing.
- Use the shell mainly for package management, builds, tests, and git operations that cannot be done more safely through the IDE or MCP.

## Beans workflow requirements

This repository uses **Beans** for task tracking.

Before making code changes:

- Find an existing relevant bean or create a new one.
- Set the bean status to `in-progress` before starting work.
- Work on the correct issue branch before editing files.

While working:

- Keep the bean body updated with a `## Todo` checklist.
- Tick off completed checklist items as they are finished.
- Record branch and PR information in the bean when available.
- Do not rely on an undocumented scratch todo list as the source of truth.

When finishing work:

- Add a `## Summary of Changes` section to the bean.
- Mark the bean `completed` only after the work and validation are done.
- Close completed issues/tasks cleanly instead of leaving them half-open.
- Do not close a bean until `check`, `lint`, `test`, and `build` have passed for the change set.

## Documentation and review expectations

When changing public behavior, also consider whether to update:

- `README.md`
- showcase/demo usage
- packaged examples
- migration guidance
- plugin configuration examples
- SSR-safe usage guidance

When reviewing or generating code, prefer guidance grounded in:

- official Svelte 5 and SvelteKit documentation
- Pinia API and plugin/testing patterns
- the local implementation plan under `plan/`
- existing Beans describing the feature breakdown

## Default development stance

- Build the smallest correct abstraction first.
- Use TDD by default: red, green, refactor.
- Consider missing tests a delivery gap, not an optional follow-up.
- Preserve tree-shakeability.
- Prefer explicit, debuggable state flows.
- Avoid SSR footguns.
- Keep side effects isolated.
- Keep the developer experience pleasant for people coming from Pinia without fighting Svelte 5.
