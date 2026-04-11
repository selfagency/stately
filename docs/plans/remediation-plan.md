# Plan: Stately Exhaustive Code Review & Remediation

The library is architecturally sound — clean mutation pipeline, strong Pinia API fidelity, good type inference. But there's one fundamental design gap plus critical issues across SSR safety, security, memory, error handling, tests, and CI.

---

## F-01: Missing Svelte Store Contract (CRITICAL)

**Zero usage of `svelte/store` anywhere.** No `writable`, `readable`, `toStore`, `fromStore`. The store contract (`{subscribe, set?}`) is not implemented on store objects. This means:

- Stores can't be used with `$store` prefix syntax in Svelte templates
- No interop with existing Svelte ecosystem tools expecting the store contract
- `toStore` / `fromStore` bridges from `svelte/store` are unused

Per your confirmation of the hybrid approach, this needs `.subscribe()` and `.set()` on `StoreShell`, plus a `toSvelteStore()` utility.

## F-02: SSR — `getDefaultStateManager()` Leaks State (CRITICAL)

create-state-manager.ts creates a lazy singleton with no server guard. All SSR requests share the same manager instance — classic user-state-leak-to-another-user bug.

## F-03: SSR — Storage Adapters Crash on Server (CRITICAL)

local-storage.ts and `session-storage.ts` throw immediately when `globalThis.localStorage` is undefined. Any store with `persist` evaluated during SSR crashes the app.

## F-04: Security — Remote State Injection via Sync (HIGH)

plugin.svelte.ts applies `store.$patch(parsed.state)` directly from remote tabs. `parseSyncMessage()` only validates envelope fields, not the `state` payload shape. A malicious tab could inject arbitrary properties.

## F-05: Memory — Devtools Timeline Unbounded (HIGH)

devtools-timeline.svelte.ts accumulates entries forever. No max size, no cleanup. Long-running apps will leak memory.

## F-06: Error Handling — Silent Persistence Failures (HIGH)

serialize.ts returns `undefined` for corrupted data, invalid JSON, and version mismatches with no diagnostic. Consumers can't tell "no data" from "corrupted data."

## F-07: Error Handling — No QuotaExceededError Catch (MEDIUM)

`localStorage.setItem()` throws when storage is full. Neither adapter nor plugin catches this.

## F-08: Error Handling — Sync Transport Errors Uncaught (MEDIUM)

Sync plugin's `transport.subscribe` callback and `transport.publish` have no try-catch. Non-serializable messages crash the plugin.

## F-09: SSR — `registeredDefinitionIds` Module-Level Singleton (MEDIUM)

define-store.svelte.ts uses a module-level `SvelteMap`. On the server, two requests defining the same store ID collide.

## F-10: Consistency — Module Augmentations Scattered (MEDIUM)

`declare module` blocks in three plugin files instead of centralized in store-types.ts.

## F-11: Security — `JSON.parse` on Storage Events Unguarded (MEDIUM)

storage-events.ts parses potentially attacker-controlled data with no size limit.

## F-12: Performance — Getters Not Memoized (LOW)

Option store getters re-evaluate on every access. Pinia uses `computed()` (cached). Should use `$derived.by()` per plan GUD-001.

## F-13: Interop — `storeToRefs` Returns Non-Store Refs (MEDIUM)

`storeToRefs()` returns `{ get value() }` objects, not Svelte store-compliant refs. Can't use `$ref` prefix.

## F-14: BroadcastChannel Uses `onmessage` (LOW)

Can be overwritten by user code. Should use `addEventListener`.

## F-15: Package — No Plugin Subpath Exports (LOW)

Only `.` export. No tree-shakeable `@selfagency/stately/persistence` etc.

## F-16: Test Coverage Gaps (HIGH)

- No store contract interop tests
- No SSR safety tests
- No sync conflict tests
- No storage quota tests
- Orphaned test in `track-async-action.spec.ts`
- Duplicate store IDs across test files
- No vitest coverage thresholds

## F-17: CI Config Issues (MEDIUM)

- `docs.yml:61` — invalid `gh_pages` environment name
- `release.yml` — duplicate YAML keys, unresolved `NPM_TOKEN` secret
- README/docs hard tab lint violations

---

## Remediation Steps

**Phase 1 — Critical (blocking correctness):**

| #   | Fix                                                          | Files                                  | Depends |
| --- | ------------------------------------------------------------ | -------------------------------------- | ------- |
| 1.1 | Add `.subscribe()` / `.set()` store contract on `StoreShell` | store-shell.svelte.ts, store-types.ts  | —       |
| 1.2 | Add `toSvelteStore()` bridge utility                         | new `store-interop.svelte.ts`          | 1.1     |
| 1.3 | Guard `getDefaultStateManager()` against SSR                 | create-state-manager.ts                | —       |
| 1.4 | Scope or remove module-level `registeredDefinitionIds`       | define-store.svelte.ts                 | —       |
| 1.5 | SSR-safe storage adapters (no-op instead of throw)           | local-storage.ts, `session-storage.ts` | —       |
| 1.6 | Validate remote state shape before patching                  | `sync/plugin.svelte.ts`                | —       |
| 1.7 | Cap devtools timeline with configurable `maxEntries`         | devtools-timeline.svelte.ts            | —       |

**Phase 2 — Error Handling & Security:** _parallel with Phase 1_

| #   | Fix                                                                           | Files                                         |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| 2.1 | Diagnostic deserialization errors (return error info, not silent `undefined`) | serialize.ts, plugin.svelte.ts                |
| 2.2 | Catch `QuotaExceededError` in storage adapters                                | local-storage.ts, `session-storage.ts`        |
| 2.3 | Wrap sync transport errors in try-catch                                       | `sync/plugin.svelte.ts`, broadcast-channel.ts |
| 2.4 | Catch compression errors                                                      | `persistence/plugin.svelte.ts`                |
| 2.5 | Use `addEventListener` for BroadcastChannel                                   | broadcast-channel.ts                          |

**Phase 3 — Consistency & Performance:** _depends on Phase 1_

| #   | Fix                                             | Files                               | Depends |
| --- | ----------------------------------------------- | ----------------------------------- | ------- |
| 3.1 | Centralize module augmentations                 | store-types.ts, remove from plugins | —       |
| 3.2 | Memoize getters via `$derived.by()`             | `create-option-store.svelte.ts`     | —       |
| 3.3 | Update `storeToRefs` for store contract interop | store-to-refs.svelte.ts             | 1.1     |
| 3.4 | Add plugin subpath exports                      | package.json                        | —       |

**Phase 4 — Tests & CI:** _depends on Phases 1-3_

| #   | Fix                                                         | Files                        |
| --- | ----------------------------------------------------------- | ---------------------------- |
| 4.1 | Store contract interop tests (`$store` prefix, `subscribe`) | new spec files               |
| 4.2 | SSR safety tests (request isolation, no singleton leak)     | new spec files               |
| 4.3 | Sync conflict resolution tests                              | `sync.spec.ts`               |
| 4.4 | Storage quota / error scenario tests                        | `persistence.spec.ts`        |
| 4.5 | Fix orphaned test in `track-async-action.spec.ts`           | `track-async-action.spec.ts` |
| 4.6 | Add vitest coverage thresholds                              | vite.config.ts               |
| 4.7 | Fix CI workflow YAML issues                                 | `docs.yml`, `release.yml`    |
| 4.8 | Fix markdown hard tab lint errors                           | README.md, docs              |

**Verification:**

1. `pnpm run check` — zero type errors
2. `pnpm run lint` — zero lint errors
3. `pnpm run test` — all pass, no orphaned tests
4. `pnpm run build` — clean build, publint passes
5. Manual: verify `$store` prefix works in Svelte template with a stately store
6. Manual: verify SSR doesn't leak state across simulated requests

**Decisions:**

- Store contract goes **on `StoreShell` directly** — every store is automatically a Svelte store
- `getDefaultStateManager()` **throws during SSR** — breaking but correct
- Getters wrapped in **`$derived.by()`** — aligns with GUD-001
- Module augmentations **centralized** in store-types.ts

**Excluded:**

- CRDT sync (per ASSUMPTION-002)
- Browser extension devtools
- VitePress content updates (separate task)
