# Exhaustive Code Review — `@selfagency/stately`

**Repository:** https://github.com/selfagency/stately
**Commit reviewed:** `main` (cloned 2026-06-23)
**Skill used:** `code-review` (Exhaustive Code Review Skill)
**Reviewer:** Super Z (automated)
**Date:** 2026-06-23

---

## Automated Check Results

Per the skill's Phase 4, the repository's quality checks were executed:

| Check       | Command                                                  | Result                                                                                                                                                                                 |
| ----------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typecheck   | `pnpm run check` (svelte-check --tsgo)                   | **PASS** — 0 errors, 0 warnings                                                                                                                                                        |
| Lint        | `pnpm run lint` (eslint + prettier --check)              | **PASS** — 1 prettier deprecation warning (`svelteBracketNewLine`)                                                                                                                     |
| Tests       | `pnpm run test` (vitest run)                             | **PASS** — 297/297 tests pass (49 server files + 1 typecheck file). Playwright browser project skipped (missing browser executable in sandbox — environment issue, not a code defect). |
| Build       | `pnpm run build` (vite build + svelte-package + publint) | **PASS** — publint reports "All good!"                                                                                                                                                 |
| Unused code | `pnpm run knip`                                          | **FAIL** — 27 unused exports reported (see Finding #19)                                                                                                                                |

**Overall automation status:** All blocking checks pass except `knip`, which reports 27 unused exports. Most are intentional public API re-exports misclassified by knip's config; a few are genuinely dead.

---

## Executive Summary

`@selfagency/stately` is a well-architected Pinia-inspired state management library for Svelte 5 runes. The codebase demonstrates strong TypeScript discipline, comprehensive test coverage (297 tests across 50+ files), SSR safety as a first-class concern, and a clean plugin architecture. The copilot-instructions.md and bundled SKILL.md show mature project governance.

The review identified **no CRITICAL issues** that would block a merge. The library is functionally correct, well-tested, and the automated quality gates pass. However, there are several **HIGH and MEDIUM severity issues** that represent real risks to users:

- **Validation plugin does not restore state when a `$patch` callback throws** after partially mutating state — this can leave stores in an inconsistent state.
- **Setup store getter+setter semantics are silently lost** when wrapping class instances — original setters are never invoked, original getters are called only once.
- **Async plugin changes action return types** from `Promise<Result>` to `Promise<Result | undefined>` without TypeScript detecting the change, which can cause runtime `undefined` access errors.
- **`@lucide/svelte` is a runtime dependency** but is only used by the inspector UI — consumers who don't use the inspector still install it.
- **Storage adapters silently swallow `QuotaExceededError`** without surfacing the failure to the user beyond an inspector notice.

The MEDIUM findings are largely performance, robustness, and developer-experience concerns (O(n²) history trimming, silent error swallowing in sync, `any` types in core library files, fragile `$dispose` chaining across plugins).

The LOW findings are style, documentation, and minor optimization opportunities.

**Merge recommendation: APPROVE AFTER FIXES** — the HIGH issues should be addressed before the next release, but the library is safe to use today for users who understand the documented behavior.

---

## Findings

### Programmatic Correctness

#### Finding 1: Validation plugin does not restore state when `$patch` callback throws

- **Severity:** HIGH
- **File(s):** `src/lib/validation/plugin.svelte.ts:59-90`
- **Description:** The validation plugin wraps `$patch` to snapshot state, apply the patch, run validation, and restore on validation failure. However, the `originalPatch(patch)` call is outside the try/catch that invokes `restoreSnapshot`. If the patch function (the `(state) => void` form) throws after partially mutating state, the throw propagates without restoration, leaving the store in a partially modified state.

```ts
// Current code (simplified)
originalPatch(patch); // ← if patch(state) throws here...

let result: boolean | string | undefined;
try {
	result = config.validate(validatable.$state);
} catch (error) {
	restoreSnapshot(); // ← ...this never runs
	throw error;
}
```

- **Why it matters:** A patch function that mutates three keys and throws on the fourth leaves the first three mutations in place. The validation contract ("rollback on failure") is silently violated. Subscribers, history, and sync will have observed the partial mutation.
- **Affected code path:** Any store with `validate` option where a user passes a function-form `$patch` that throws.
- **Root cause:** The restore logic was scoped to validation failures, not to patch-execution failures.
- **Recommended fix:** Wrap `originalPatch(patch)` in its own try/catch that calls `restoreSnapshot()` on throw:

```ts
try {
	originalPatch(patch);
} catch (error) {
	restoreSnapshot();
	throw error;
}
```

- **Verification:** Add a regression test: define a store with `validate`, call `$patch((state) => { state.a = 1; throw new Error('boom'); })`, assert `state.a` is unchanged.

---

#### Finding 2: Setup store getter+setter semantics are silently lost

- **Severity:** HIGH
- **File(s):** `src/lib/runtime/create-setup-store.svelte.ts:55-67`
- **Description:** When a setup store returns a class instance (or any object with accessor properties that have both `get` and `set`), Stately calls the original getter once to capture the initial value, stores it in `state[key]`, then redefines the property to read/write directly from `state`. The original getter is never called again, and the original setter is **never invoked** — writes go to `state[key]` via `shell.setStateValue`.

```ts
// Current behavior for a class:
class Counter {
	_count = 0;
	get count() {
		return this._count * 2;
	} // computed getter
	set count(v) {
		this._count = v / 2;
	} // side-effecting setter
}
// After Stately wraps it:
// - count initially reads as 0 (getter called once)
// - store.count = 10 writes 10 to state.count (setter NOT called, _count unchanged)
// - subsequent reads return 10 (getter NOT called)
```

- **Why it matters:** Users who model state with classes that have computed getters or side-effecting setters (a documented escape hatch per the README: "setup stores remain the escape hatch for class instances and other custom prototypes") will silently lose that behavior. The README and SKILL.md do not document this limitation.
- **Affected code path:** Any setup store returning a class instance with accessor properties.
- **Root cause:** The implementation prioritizes routing writes through the mutation pipeline over preserving accessor semantics. This is a reasonable design choice but is undocumented and surprising.
- **Recommended fix:** Either (a) document the limitation prominently in the README, SKILL.md, and `docs/guide/define-store.md`, or (b) for getter+setter pairs, invoke the original setter inside the redefined setter and re-invoke the original getter on every read (at the cost of reactivity — the getter would need to be wrapped in `$derived.by`).
- **Verification:** Add a test that creates a setup store from a class with a computed getter, mutates the underlying private field, and asserts the getter re-computes (currently fails).

---

#### Finding 3: Async plugin changes action return type to `Promise<Result | undefined>`

- **Severity:** HIGH
- **File(s):** `src/lib/async/plugin.svelte.ts:65-72`, `src/lib/async/concurrency.ts:26-66`
- **Description:** The async plugin replaces store actions with `tracked.run`, which calls `concurrency.run(...)`. The `run` method's return type is `Promise<Result | undefined>` because the `drop` concurrency mode returns `Promise.resolve(undefined)` when a call is dropped, and `enqueue`/`dedupe` can also return `undefined` in edge cases. However, the original action's declared return type is `Promise<Result>`. The assignment `store[key] = tracked.run` bypasses TypeScript's type checking because `store` is typed as `StoreCustomProperties & Record<string, unknown>`.

```ts
// concurrency.ts:26
run(...args: Args): Promise<Result | undefined> {  // ← undefined possible
  switch (mode) {
    case 'drop':
      if (activeCount > 0) {
        return Promise.resolve(undefined);  // ← dropped calls return undefined
      }
      return start(...args);
    // ...
  }
}
```

- **Why it matters:** Users awaiting a dropped action will get `undefined` instead of `Result`. Without a type-level signal, they may write `const data = await store.fetchData();` and access `data.property`, which throws at runtime. The `drop` policy is documented, but the return-type widening is not.
- **Affected code path:** Any store action wrapped by the async plugin with `drop` (or `enqueue`/`dedupe` in edge cases) concurrency policy.
- **Root cause:** The async plugin's store typing uses `Record<string, unknown>`, losing the original action signatures.
- **Recommended fix:** (a) Document that `drop`/`enqueue`/`dedupe` actions may resolve to `undefined` and users must check; (b) Ideally, type the wrapped action as `(...args) => Promise<Result | undefined>` so TypeScript forces users to handle the `undefined` case. This requires improving the plugin's generic typing to preserve action signatures.
- **Verification:** Add a type test (`types.test-d.ts`) asserting that an action wrapped with `drop` policy has return type `Promise<Result | undefined>`.

---

#### Finding 4: FSM `_exit` side effects not rolled back when `_enter` throws

- **Severity:** MEDIUM
- **File(s):** `src/lib/fsm/fsm-controller.svelte.ts:60-76`
- **Description:** The `send()` method calls `_exit` (before state change), sets `current = nextState`, then calls `_enter` in a try/catch that rolls back `current` on failure. However, if `_exit` mutated store state (e.g., via `this` or closures) before `_enter` throws, the FSM `current` rolls back but the `_exit` mutations persist. The store is left in an inconsistent state: FSM says "still in old state" but the state was modified as if transitioning out.

```ts
const exitHook = statesMap.get(from)?._exit;
if (typeof exitHook === 'function') {
	exitHook(context); // ← may mutate store state
}

current = nextState;

try {
	const enterHook = statesMap.get(nextState)?._enter;
	if (typeof enterHook === 'function') {
		enterHook(context); // ← if this throws...
	}
} catch (error) {
	current = from; // ← ...current rolls back, but _exit mutations persist
	throw error;
}
```

- **Why it matters:** Transition hooks that mutate state are a legitimate use case (e.g., clearing a form on exit). A failing `_enter` hook leaves the state half-transitioned.
- **Affected code path:** FSM stores with `_exit` hooks that mutate state and `_enter` hooks that can throw.
- **Root cause:** The rollback only covers the FSM `current` field, not the broader store state.
- **Recommended fix:** Document that `_exit` hooks should be pure (no state mutations), or snapshot state before `_exit` and restore on `_enter` failure (expensive). At minimum, add a dev-mode warning when `_exit` is present alongside a throwing `_enter`.
- **Verification:** Add a test with an `_exit` that mutates state and an `_enter` that throws; assert the state is consistent (either document current behavior or fix).

---

### Data Flow Correctness

#### Finding 5: `$dispose` override chaining is fragile across plugins

- **Severity:** MEDIUM
- **File(s):** `src/lib/persistence/plugin.svelte.ts:297-307`, `src/lib/history/plugin.svelte.ts:78-87`, `src/lib/sync/plugin.svelte.ts:227-242`
- **Description:** Each plugin that needs cleanup overrides `$dispose` by capturing the current `$dispose.bind(store)` and wrapping it in a new function. The cleanup order is the reverse of plugin registration order. If plugins are registered in a different order, the cleanup order changes. There is no formal lifecycle hook (e.g., `$onDispose(callback)`) — plugins must manually chain.

```ts
// Pattern repeated in 3 plugins:
const dispose = store.$dispose.bind(store);
Object.defineProperty(store, '$dispose', {
	value() {
		// plugin-specific cleanup
		unsubscribe();
		dispose(); // calls the previous $dispose
	}
	// ...
});
```

- **Why it matters:** If a plugin's cleanup depends on another plugin's state still being available (e.g., history plugin reading persistence state during cleanup), the order matters. The current implicit chaining is brittle and undocumented.
- **Affected code path:** Any store with multiple plugins that override `$dispose`.
- **Root cause:** No formal lifecycle hook system; plugins use ad-hoc wrapping.
- **Recommended fix:** Add a `$onDispose(callback)` registration method to the store shell. Plugins register cleanup callbacks instead of overriding `$dispose`. The shell calls them in LIFO order during `$dispose`.
- **Verification:** Add a test with multiple plugins that override `$dispose`; assert cleanup order and that all callbacks fire.

---

#### Finding 6: Sync plugin swallows all errors silently

- **Severity:** MEDIUM
- **File(s):** `src/lib/sync/plugin.svelte.ts:190-192`, `221-223`
- **Description:** The sync plugin's inbound message handler and outbound publish loop both use `try/catch` with empty catch blocks. Parse errors, validation errors, transport errors, and `$patch` errors (e.g., from the validation plugin rejecting a remote patch) are all silently swallowed. There are no dev-mode warnings.

```ts
// Inbound (line 190-192):
} catch {
  // Message parse or validation error — skip silently
}

// Outbound (line 221-223):
} catch {
  // Non-serializable or transport failure — skip silently
}
```

- **Why it matters:** Users could have sync silently broken (e.g., a validation plugin rejecting all remote patches, or a transport failure) with no signal. Debugging requires reading the source code.
- **Affected code path:** Any sync-enabled store where remote messages fail to parse, validate, or apply.
- **Root cause:** Defensive error handling prioritized over observability.
- **Recommended fix:** Add `console.warn` in non-production mode (guarded by `import.meta.env.DEV` or `process.env.NODE_ENV !== 'production'`). Optionally, surface errors via the inspector notice system.
- **Verification:** Add a test that triggers a sync error and asserts a warning is logged (mock `console.warn`).

---

### Type Correctness and Flow

#### Finding 7: `any` types in core library files lack strong justification

- **Severity:** MEDIUM
- **File(s):** `src/lib/define-store.svelte.ts:16`, `src/lib/pinia-like/store-types.ts:4`, `src/lib/pinia-like/store-to-refs.svelte.ts:4`, `src/lib/action-helpers.ts:2`, `src/lib/runtime/subscriptions.ts:12`, `src/lib/runtime/create-option-store.svelte.ts:6`, `src/lib/runtime/create-setup-store.svelte.ts:5`, `src/lib/runtime/store-shell.svelte.ts:15`, `src/lib/root/create-state-manager.ts:30`, `src/lib/utils.ts:9,11`
- **Description:** The `AnyFunction = (...args: any[]) => unknown` type alias appears in 8 core library files. The `utils.ts` file uses `any` in `WithoutChild<T>` and `WithoutChildren<T>` conditional types. The eslint-disable comments are present but lack the "explicit, strong, documented justification" required by the code-review skill and the project's own copilot-instructions.md ("Avoid `any` unless there is no better option and the reason is documented").

```ts
// Repeated pattern:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => unknown;
```

- **Why it matters:** `any` disables type checking for the entire argument list, which can mask real type errors. The project's own guidelines flag this as a defect without justification.
- **Affected code path:** All store definitions, action wrapping, and type inference.
- **Root cause:** Historical use of `any[]` for generic function arguments; `unknown[]` would be stricter but requires `Parameters<T>` extraction in some places.
- **Recommended fix:** Replace `(...args: any[]) => unknown` with `(...args: unknown[]) => unknown` where feasible. For `utils.ts`, replace `{ child?: any }` with `{ child?: unknown }`. Where `any` is genuinely needed (e.g., `StateManagerPlugin<any, any, any>[]` for heterogeneous plugin storage), add a comment explaining why `unknown` doesn't work.
- **Verification:** Run `pnpm run check` and `pnpm run test` after changes; all should still pass.

---

#### Finding 8: `createStateManager().use()` return type doesn't reflect plugin augmentation

- **Severity:** LOW
- **File(s):** `src/lib/root/create-state-manager.ts:38-41`, `src/lib/root/types.ts:38-58`
- **Description:** `use(plugin)` returns `StateManager` (the base interface), not a typed manager that reflects the plugin's augmentation. Users rely on module augmentation (`declare module '../pinia-like/store-types.js'`) for type safety on store instances, but the manager itself doesn't carry plugin type information.

```ts
use<
  Definition extends StoreDefinition = StoreDefinition,
  Store = unknown,
  Augmentation extends object = DefaultPluginAugmentation<Store>
>(
  plugin: StateManagerPlugin<Definition, Store, Augmentation>
): StateManager;  // ← Augmentation is not reflected in return type
```

- **Why it matters:** Less ergonomic DX — users can't get auto-complete for plugin-added manager methods (if any future plugin adds them). Currently, plugins augment stores, not managers, so the impact is minimal.
- **Affected code path:** Plugin registration.
- **Root cause:** The return type is fixed to `StateManager` for chaining simplicity.
- **Recommended fix:** This is acceptable for the current plugin model. If future plugins augment the manager itself, revisit. Document the pattern in the plugin authoring guide.
- **Verification:** N/A (design decision, not a bug).

---

### Performance Issues

#### Finding 9: History and devtools timeline use O(n) `Array.shift()` in a loop for trimming

- **Severity:** MEDIUM
- **File(s):** `src/lib/history/history-controller.svelte.ts:42-46`, `src/lib/runtime/devtools-timeline.svelte.ts:27-30`
- **Description:** Both the history controller and devtools timeline trim entries using `while (entries.length > limit) { entries.shift(); }`. Each `shift()` is O(n) because it reindexes all subsequent elements. For the default history limit of 50, this is negligible. For large limits (e.g., 1000) or high-frequency mutations, trimming becomes O(n²).

```ts
const trim = () => {
	while (state.entries.length > limit) {
		state.entries.shift(); // O(n) per call
		state.index = Math.max(0, state.index - 1);
	}
};
```

- **Why it matters:** For users who configure large history limits or have high-frequency mutations, the trim operation can cause jank.
- **Affected code path:** History recording and devtools timeline recording on every mutation.
- **Root cause:** `Array.shift()` was chosen for simplicity; bulk removal was not considered.
- **Recommended fix:** Replace with `entries.splice(0, entries.length - limit)` for bulk removal, then adjust `state.index` by the removed count. This is O(n) total instead of O(n²).
- **Verification:** Add a performance test with `limit: 1000` and 10,000 mutations; assert trim time is sub-linear.

---

#### Finding 10: Deep equality check `isStateEqual` is O(n) on every action call

- **Severity:** MEDIUM
- **File(s):** `src/lib/runtime/store-shell.svelte.ts:48-137`, `268-308`
- **Description:** The `defineAction` wrapper snapshots state before the action (`beforeState = cloneState(config.state)`) and, if no explicit mutation was recorded during the action, snapshots again (`afterState`) and runs a recursive deep equality check (`isStateEqual`). For large state objects, this is two O(n) snapshots plus an O(n) deep compare on every action invocation. The code comment acknowledges this: "NOTE: $state.snapshot() is O(n) in state size."

```ts
const beforeState = cloneState(config.state); // O(n)
// ... action runs ...
const flushInferredDirectMutation = () => {
	if (disposed || mutationCount !== mutationCountBeforeAction) {
		return; // short-circuit if explicit mutation recorded
	}
	const afterState = cloneState(config.state); // O(n)
	if (!isStateEqual(beforeState, afterState)) {
		// O(n) deep compare
		mutationQueue.recordChange({ action: String(key), inferred: true });
	}
};
```

- **Why it matters:** For stores with large state (e.g., a 10,000-item list) and frequent actions, the snapshot+compare overhead can dominate. The short-circuit (`mutationCount !== mutationCountBeforeAction`) helps when actions use `$patch`, but direct mutations (e.g., `this.items.push(x)`) bypass the short-circuit and always trigger the full compare.
- **Affected code path:** Every action call on every store.
- **Root cause:** The runtime infers direct mutations by diffing snapshots, which requires full state traversal.
- **Recommended fix:** Consider a `Proxy`-based dirty flag on the state object during action execution, or expose an explicit `this.$mutate()` helper that actions can call to signal mutation without the snapshot overhead. Document the performance characteristics in the define-store guide.
- **Verification:** Add a benchmark test with large state; document the per-action overhead.

---

#### Finding 11: `structuredClone` is called on every validation `$patch` and every history snapshot

- **Severity:** MEDIUM
- **File(s):** `src/lib/validation/plugin.svelte.ts:64,66`, `src/lib/history/plugin.svelte.ts:43`
- **Description:** The validation plugin calls `structuredClone($state.snapshot(state))` on every `$patch` (to capture a restore point) and again on rollback. The history plugin calls `structuredClone($state.snapshot(store.$state))` on every mutation. `structuredClone` is O(n) and can throw on non-cloneable values (functions, DOM nodes, etc.).

```ts
// validation/plugin.svelte.ts:64
const snapshot = structuredClone($state.snapshot(validatable.$state)) as typeof validatable.$state;
const restoreSnapshot = () => {
	validatable.$state = structuredClone(snapshot) as typeof validatable.$state;
};
```

- **Why it matters:** For large or non-cloneable state, this is expensive or can crash. Setup stores with class instances may have methods on the prototype that `structuredClone` handles, but accessor-only properties could be lost.
- **Affected code path:** Every `$patch` on validation-enabled stores; every mutation on history-enabled stores.
- **Root cause:** `structuredClone` was chosen for true deep immutability, per the SKILL.md guidance ("use `structuredClone($state.snapshot(x))` for true immutable snapshots").
- **Recommended fix:** Wrap `structuredClone` calls in try/catch with a fallback to `$state.snapshot()` (shallow Svelte snapshot) if cloning fails. Document the fallback behavior. For validation, consider deferring the snapshot until validation actually fails (optimistic apply, rollback on failure — current approach is pessimistic).
- **Verification:** Add a test with state containing a function or DOM node; assert the store doesn't crash.

---

### Security Vulnerabilities

#### Finding 12: Prototype pollution defenses are present but incomplete in sync filter

- **Severity:** LOW
- **File(s):** `src/lib/sync/plugin.svelte.ts:132-143`, `src/lib/internal/sanitize.ts:1-35`
- **Description:** The `filterToKnownKeys` function in the sync plugin blocks `__proto__`, `constructor`, and `prototype` keys explicitly, and `sanitizeValue` blocks the same keys recursively. This is good. However, `filterToKnownKeys` uses `Reflect.get(remote, key)` to read values, which follows the prototype chain. If a malicious remote object has a getter on `Object.prototype` for a known key, it would be invoked. The `sanitizeValue` call on the value mitigates this for nested objects, but the top-level `Reflect.get` is unguarded.

```ts
function filterToKnownKeys(remote: object): Partial<typeof syncedStore.$state> | undefined {
	const filtered: Record<string, unknown> = {};
	for (const key of Object.keys(remote)) {
		// Object.keys only returns own enumerable
		if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
		if (knownStateKeys.has(key)) {
			filtered[key] = sanitizeValue(Reflect.get(remote, key)); // ← Reflect.get follows prototype
			hasKnownKey = true;
		}
	}
	return hasKnownKey ? (filtered as Partial<typeof syncedStore.$state>) : undefined;
}
```

- **Why it matters:** `Object.keys` only returns own enumerable properties, so prototype-inherited properties are not iterated. The risk is low. But `Reflect.get` on an own property with a getter could invoke attacker-controlled code if the deserialized object has a getter. In practice, `JSON.parse` (used in the storage transport) cannot produce getters, so this is only a concern for custom transports.
- **Affected code path:** Sync plugin with custom transports that don't use `JSON.parse`.
- **Root cause:** Defensive coding doesn't account for accessor properties on deserialized objects.
- **Recommended fix:** Use `Object.getOwnPropertyDescriptor(remote, key)?.value` instead of `Reflect.get` to avoid invoking getters. Or document that custom transports must use `JSON.parse`.
- **Verification:** Add a test with a malicious object that has a getter on a known key; assert the getter is not invoked.

---

#### Finding 13: Persistence `QuotaExceededError` silently swallowed without user notification

- **Severity:** HIGH
- **File(s):** `src/lib/persistence/adapters/local-storage.ts:39-47`, `src/lib/persistence/adapters/session-storage.ts:39-47`
- **Description:** When `localStorage.setItem` or `sessionStorage.setItem` throws `QuotaExceededError`, the adapter catches it, reports an inspector notice, and silently returns. The `setItem` method appears to succeed (returns `void` without throwing). The persistence plugin's `flush()` does not know the write failed. The only signal is the inspector notice, which requires the inspector to be open.

```ts
try {
	s.setItem(key, value);
} catch (error) {
	if (error instanceof DOMException && error.name === 'QuotaExceededError') {
		reportStatelyInspectorNotice(`localStorage quota exceeded for key "${key}".`);
		return; // ← silent failure
	}
	throw error;
}
```

- **Why it matters:** Users could lose persistence silently. The store's in-memory state continues to update, but writes to storage fail without error. On page reload, the state reverts to the last successfully persisted snapshot. This is a data-loss risk.
- **Affected code path:** Any persistence-enabled store when storage quota is exceeded.
- **Root cause:** The adapter treats quota errors as non-fatal to avoid crashing the store, but doesn't propagate the failure to the plugin or user.
- **Recommended fix:** (a) Add a `console.warn` in non-production mode; (b) Re-throw the error and let the persistence plugin's `onError` callback handle it (the plugin already has an `onError` option); (c) Document that `onError` is the recommended way to handle quota errors. At minimum, the adapter should not silently swallow — it should either throw or call a provided error handler.
- **Verification:** Add a test that mocks `setItem` to throw `QuotaExceededError`; assert the persistence plugin's `onError` callback is invoked.

---

### API Conformity and Consistency

#### Finding 14: `@lucide/svelte` is a runtime dependency but only used by inspector UI

- **Severity:** HIGH
- **File(s):** `package.json:106`
- **Description:** `@lucide/svelte` is listed in `dependencies` (runtime), but it's only imported by `src/lib/inspector/InspectorDrawer.svelte` and inspector-related UI components. Consumers who don't use the inspector (the vast majority) still install `@lucide/svelte` and pay the bundle cost if tree-shaking doesn't eliminate it.

```json
"dependencies": {
  "@lucide/svelte": "^1.8.0",   // ← only used by inspector
  "lz-string": "^1.5.0"
}
```

- **Why it matters:** Unnecessary dependency bloat for non-inspector users. `@lucide/svelte` is a large icon library.
- **Affected code path:** Package installation and bundling for all consumers.
- **Root cause:** The inspector is bundled with the library but is a dev-only tool.
- **Recommended fix:** Move `@lucide/svelte` to `peerDependencies` with `optional: true`, or to `optionalDependencies`. The inspector export (`./inspector`) would require users to install `@lucide/svelte` if they want the inspector UI. Alternatively, lazy-load the inspector UI components so `@lucide/svelte` is only imported when the inspector is mounted.
- **Verification:** Run `pnpm run build` and check the inspector chunk; verify `@lucide/svelte` is not in the main bundle.

---

#### Finding 15: `engines` field dropped from published package.json

- **Severity:** LOW
- **File(s):** `scripts/write-dist-package.js:69-105`
- **Description:** The `writeDistPackage.js` script constructs the published `package.json` by destructuring specific fields from the source `package.json`. The `engines` field is not included in the destructuring or the `distPackage` object. Consumers on Node < 20 won't see a warning.

```js
const {
	name,
	version,
	description,
	keywords,
	homepage,
	bugs,
	repository,
	license,
	type,
	exports,
	svelte,
	types,
	sideEffects,
	dependencies,
	peerDependencies,
	publishConfig
} = packageJson;
// ← engines is not destructured
```

- **Why it matters:** The source `package.json` declares `"engines": { "node": ">=20" }`, but this is lost in the published package. npm's `engine-strict` setting won't enforce it.
- **Affected code path:** Package publication.
- **Root cause:** The script's field list predates the `engines` addition.
- **Recommended fix:** Add `engines` to the destructuring and to `distPackage`.
- **Verification:** Run `pnpm run build` and inspect `dist/package.json` for the `engines` field.

---

#### Finding 16: Async plugin action return type widening is undocumented

- **Severity:** MEDIUM (cross-reference Finding 3)
- **File(s):** `docs/reference/async.md` (not reviewed in detail), `docs/guide/...`
- **Description:** The async plugin's `drop`, `enqueue`, and `dedupe` policies can cause `run()` to return `Promise.resolve(undefined)`. This means wrapped actions may resolve to `undefined`. The API reference and guide should document this behavior and advise users to check for `undefined` when awaiting actions with these policies.
- **Why it matters:** Users awaiting dropped actions will get `undefined` and may access properties on it, causing runtime errors.
- **Affected code path:** Async plugin documentation.
- **Root cause:** Documentation gap.
- **Recommended fix:** Add a "Return Type Considerations" section to the async plugin docs explaining when `undefined` is returned and how to handle it.
- **Verification:** Review docs after update.

---

### Documentation Consistency

#### Finding 17: Setup store class-instance limitations not documented

- **Severity:** MEDIUM (cross-reference Finding 2)
- **File(s):** `README.md:84`, `skills/stately/SKILL.md:79`, `docs/guide/define-store.md` (not reviewed)
- **Description:** The README says "setup stores remain the escape hatch for class instances and other custom prototypes" but does not document that getter+setter pairs lose their original semantics (getter called once, setter never called). The SKILL.md says "Setup stores support class instances with prototype getters/methods resolved automatically" which is misleading for accessor pairs.
- **Why it matters:** Users modeling state with classes will be surprised by the semantic loss.
- **Affected code path:** User documentation.
- **Root cause:** Documentation predates the implementation nuance.
- **Recommended fix:** Update README, SKILL.md, and `docs/guide/define-store.md` to document: (a) class methods are bound as actions; (b) getter-only properties remain live (re-invoked on read); (c) getter+setter pairs are snapshotted once and the original setter is not invoked on writes — writes go through Stately's mutation pipeline.
- **Verification:** Review docs after update.

---

#### Finding 18: FSM `__stately_fsm` magic key not documented for persistence/sync interactions

- **Severity:** LOW
- **File(s):** `src/lib/fsm/plugin.svelte.ts:49`, `skills/stately/SKILL.md:169`
- **Description:** The FSM plugin stores the current FSM state in `store.$state['__stately_fsm']`. This key is persisted with the store (unless excluded via `omit`) and synced to other tabs. The SKILL.md mentions "FSM state stored in `__stately_fsm` internal field" but doesn't explain the persistence/sync implications. If a user uses `pick` to persist only specific keys and forgets `__stately_fsm`, the FSM state won't persist. If they use `omit` and omit `__stately_fsm`, same issue.
- **Why it matters:** Users may accidentally exclude FSM state from persistence or sync, leading to FSM resetting on reload or desyncing across tabs.
- **Affected code path:** FSM stores with persistence or sync.
- **Root cause:** The magic key is an implementation detail not surfaced in user-facing docs.
- **Recommended fix:** Document in the FSM guide that `__stately_fsm` is part of the store state and is affected by `pick`/`omit`. Consider auto-including it in persistence unless explicitly omitted.
- **Verification:** Review docs after update.

---

### Best Practices

#### Finding 19: Knip reports 27 unused exports — config needs attention

- **Severity:** LOW
- **File(s):** `knip.json`, various source files
- **Description:** `pnpm run knip` fails with 27 unused exports. Many are legitimate public API types re-exported via `src/lib/index.ts` (e.g., `StateManager`, `StoreDefinition`, `SyncPluginOptions`) that knip doesn't recognize because they're consumed via module augmentation. Others are genuinely internal types that shouldn't be exported (e.g., `InternalFsmController`, `MutationCommit`, `StoreShellBuilder`, `DeserializeResult`).

```
InternalFsmController         src/lib/fsm/fsm-controller.svelte.ts:5
DeserializeSuccess            src/lib/persistence/serialize.ts:8
DeserializeFailure            src/lib/persistence/serialize.ts:13
DeserializeResult             src/lib/persistence/serialize.ts:18
StateManager                  src/lib/root/create-state-manager.ts:135   (re-exported)
StoreDefinition               src/lib/root/create-state-manager.ts:135   (re-exported)
MutationCommit                src/lib/runtime/mutation-queue.svelte.ts:3
StoreShellBuilder             src/lib/runtime/store-shell.svelte.ts:34
SyncPluginOptions             src/lib/sync/plugin.svelte.ts:17            (re-exported)
WithoutChild, WithoutChildren, WithoutChildrenOrChild, WithElementRef  (shadcn utils)
```

- **Why it matters:** `knip` is part of the lint pipeline (`pnpm run lint` doesn't run knip, but `pnpm run knip` is a separate script). The failing knip config means it's not catching real unused code. Genuinely internal types (`InternalFsmController`, `MutationCommit`) are exported unnecessarily, leaking implementation details.
- **Affected code path:** Developer tooling.
- **Root cause:** Knip config doesn't account for public API re-exports via `index.ts`.
- **Recommended fix:** (a) Add `@public` JSDoc tags or knip's `@public` annotation to legitimately public types; (b) Remove `export` from genuinely internal types (`InternalFsmController`, `MutationCommit`, `StoreShellBuilder`, `DeserializeResult`); (c) Add the shadcn utility types to knip's ignore list or mark them as public.
- **Verification:** Run `pnpm run knip` — should pass with 0 unused exports.

---

#### Finding 20: Silent error swallowing in persistence rehydrate paths

- **Severity:** MEDIUM
- **File(s):** `src/lib/persistence/plugin.svelte.ts:226-228`, `234-237`
- **Description:** The `rehydrate` function has two silent catch blocks: one for TTL JSON parsing and one for decompression failure. Both return `false` (rehydration skipped) without logging. If a user's persisted data is corrupted (e.g., partial write due to crash), rehydration silently fails and the store starts fresh. The user has no signal that data was lost.

```ts
// TTL parse failure (line 226-228):
} catch {
  // Not a TTL envelope; continue with the raw payload.
}

// Decompression failure (line 234-237):
} catch {
  reportStatelyInspectorNotice(`Decompression failed for store "${store.$id}".`);
  return false;
}
```

- **Why it matters:** Silent data loss on corrupted persistence. The decompression failure does report an inspector notice, but the TTL parse failure is completely silent.
- **Affected code path:** Persistence rehydration on page load.
- **Root cause:** Defensive coding prioritizes not crashing over observability.
- **Recommended fix:** Add `console.warn` in non-production for both cases. For TTL parse failure, the comment says "continue with raw payload" which is fine, but a dev-mode warning helps debugging. Consider surfacing these via the `onError` callback.
- **Verification:** Add a test with corrupted persisted data; assert a warning is logged.

---

### Code Style and Codebase Consistency

#### Finding 21: Prettier deprecation warning for `svelteBracketNewLine`

- **Severity:** LOW
- **File(s):** `prettier.config.js:13`
- **Description:** The prettier config uses `svelteBracketNewLine: false`, which is deprecated in newer versions of `prettier-plugin-svelte`. The lint output shows: `[warn] svelteBracketNewLine is deprecated.`

```js
overrides: [
	{
		files: '*.svelte',
		options: {
			// ...
			svelteBracketNewLine: false // ← deprecated
			// ...
		}
	}
];
```

- **Why it matters:** The option may be removed in a future version, causing formatting changes.
- **Affected code path:** Prettier formatting.
- **Root cause:** Config predates the deprecation.
- **Recommended fix:** Check the `prettier-plugin-svelte` migration guide for the replacement option (likely `bracketSameLine` already in the root config, or a svelte-specific equivalent). Remove the deprecated option.
- **Verification:** Run `pnpm run lint` — no deprecation warning.

---

#### Finding 22: `process.env?.NODE_ENV` check may not work in Vite browser bundles

- **Severity:** LOW
- **File(s):** `src/lib/runtime/store-shell.svelte.ts:171`
- **Description:** The dev-mode warning for native `Map`/`Set` in state checks `typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'`. In Vite browser bundles, `process.env.NODE_ENV` is typically replaced at build time with a string literal, but accessing `process.env` directly may not work unless Vite's define shim is configured. The `typeof process !== 'undefined'` guard prevents crashes (in browser, `process` is undefined), but the warning may never fire in production browser bundles where it's most useful during development.

```ts
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
	// ... warn about native Map/Set
}
```

- **Why it matters:** The dev warning is intended to help users catch a common Svelte 5 footgun (native Maps/Sets aren't deeply reactive). If it doesn't fire in Vite browser dev mode, users miss the warning.
- **Affected code path:** Store initialization in browser dev mode.
- **Root cause:** Node-style env check in isomorphic code.
- **Recommended fix:** Use `import.meta.env.DEV` (Vite-specific, tree-shaken in production) or `import.meta.env.MODE !== 'production'` for Vite compatibility. For SvelteKit, `import.meta.env.DEV` is always available. Fall back to `typeof process !== 'undefined'` for non-Vite environments.
- **Verification:** Run `pnpm run dev`, create a store with a native `Map` in state, verify the warning appears in the browser console.

---

#### Finding 23: Inconsistent `console.error` vs inspector notice for persistence failures

- **Severity:** LOW
- **File(s):** `src/lib/persistence/plugin.svelte.ts:274-281`
- **Description:** The `handleFlushError` function calls `reportStatelyInspectorNotice` AND `console.error` when no `onError` callback is provided. But other failure paths (e.g., decompression failure at line 235, quota exceeded in adapters) only call `reportStatelyInspectorNotice`. This inconsistency means some failures are visible in the console and others aren't.

```ts
const handleFlushError = (error: unknown) => {
	if (persist.onError) {
		persist.onError(error);
	} else {
		reportStatelyInspectorNotice(`Flush failed for store "${store.$id}": ${String(error)}`);
		console.error(`[Stately] Persistence flush failed for store "${store.$id}":`, error);
	}
};
```

- **Why it matters:** Users debugging persistence issues may miss failures that only go to the inspector.
- **Affected code path:** Persistence error handling.
- **Root cause:** Ad-hoc error reporting across different code paths.
- **Recommended fix:** Standardize: all persistence failures should (a) call `onError` if provided, (b) call `reportStatelyInspectorNotice` always, (c) `console.warn` in non-production. Create a helper function to ensure consistency.
- **Verification:** Audit all `catch` blocks in the persistence plugin; verify consistent error reporting.

---

### Linting and Code Quality Checks

#### Finding 24: `@typescript/native-preview` and `typescript: ^6.0.2` are bleeding-edge versions

- **Severity:** LOW
- **File(s):** `package.json:126, 152`
- **Description:** The project uses `typescript: ^6.0.2` and `@typescript/native-preview: 7.0.0-dev.20260413.1` (a Go-based TypeScript compiler preview). The `check` script uses `svelte-check --tsgo` which relies on the native preview. These are non-standard, future-dated versions that may not be available to all contributors or CI environments.

```json
"@typescript/native-preview": "7.0.0-dev.20260413.1",
"typescript": "^6.0.2",
```

- **Why it matters:** Contributors with stable TypeScript installations may not be able to run `pnpm run check`. CI environments pinned to stable TypeScript may fail.
- **Affected code path:** Development workflow, CI.
- **Root cause:** Bleeding-edge adoption.
- **Recommended fix:** Document in CONTRIBUTING.md that the project requires the native preview for `pnpm run check`. Consider providing a fallback `check:stable` script that uses standard `tsc`. Ensure CI uses the same versions.
- **Verification:** Verify CI passes with the declared versions.

---

### Testing Coverage and Verification

#### Finding 25: Playwright browser tests not executable in default environment

- **Severity:** LOW (environment, not code)
- **File(s):** `vite.config.ts:49-62`, CI workflow
- **Description:** The Vitest config includes a `client` project that uses `@vitest/browser-playwright` with Chromium. Running `pnpm run test` requires `pnpm exec playwright install` to download the Chromium binary. The test suite reports 49 passed files but the `client` project's browser tests are skipped (the "1 error" is the Playwright launch failure). CI likely runs `playwright install` first, but local contributors may not know to.

- **Why it matters:** New contributors running `pnpm run test` for the first time see an error and may think the suite is broken.
- **Affected code path:** Local development.
- **Root cause:** Playwright browser binary not auto-installed.
- **Recommended fix:** Add a `postinstall` script or a `prepare` hook that runs `playwright install chromium` (or document it in CONTRIBUTING.md). Alternatively, make the browser project optional via an env var.
- **Verification:** Run `pnpm install && pnpm run test` in a fresh checkout — should pass without manual intervention.

---

#### Finding 26: Missing regression tests for identified edge cases

- **Severity:** MEDIUM
- **File(s):** Various spec files
- **Description:** The review identified several edge cases that lack test coverage:
  - Validation plugin with throwing patch function (Finding 1)
  - Setup store with class getter+setter pairs (Finding 2)
  - Async plugin `drop` policy return value (Finding 3)
  - FSM `_exit` mutation + `_enter` throw (Finding 4)
  - Persistence with both TTL and compression (verified manually, no explicit test)
  - Sync plugin with malicious remote object (Finding 12)
  - Storage `QuotaExceededError` propagation (Finding 13)

- **Why it matters:** These edge cases represent real user scenarios that could regress without detection.
- **Affected code path:** Test suite.
- **Root cause:** TDD focus on primary paths; edge cases missed.
- **Recommended fix:** Add regression tests for each identified edge case per the verification steps in the corresponding findings.
- **Verification:** All new tests pass; coverage thresholds maintained.

---

### Library and API Documentation Verification

#### Finding 27: Svelte 5 runes usage conforms to current API

- **Severity:** N/A (positive finding)
- **File(s):** All `.svelte.ts` files
- **Description:** The codebase correctly uses Svelte 5 runes (`$state`, `$derived`, `$derived.by`, `$effect`) in `.svelte.ts` files per the copilot-instructions.md. `$state.snapshot()` is used for serialization, `structuredClone($state.snapshot(x))` for immutable copies, `createSubscriber` from `svelte/reactivity` for external subscriptions, and `SvelteMap`/`SvelteSet` are recommended in dev warnings. The `svelte.config.js` forces runes mode. No deprecated Svelte 4 patterns detected.

---

#### Finding 28: `lz-string` API usage is correct

- **Severity:** N/A (positive finding)
- **File(s):** `src/lib/persistence/compression/lz-string.ts`
- **Description:** The LZ-string compression wrapper correctly uses `compressToUTF16` and `decompressFromUTF16` from the `lz-string` library. The `decompress` function handles the prefix check and legacy fallback correctly. The `?? undefined` handles `null` return from `decompressFromUTF16`.

---

#### Finding 29: Vite plugin API usage is correct but uses deprecated patterns

- **Severity:** LOW
- **File(s):** `src/lib/inspector/vite-plugin.ts`
- **Description:** The Vite plugin correctly implements `resolveId`, `load`, and `transform` hooks. The `apply: 'serve'` and `enforce: 'pre'` settings are correct. However, the `transform` hook's check for `isViteClientModule` (hardcoded path `/vite/dist/client/client.mjs`) is brittle and may break with Vite version upgrades. Vite 8 is used (`"vite": "^8.0.8"`), and the path may change in future versions.

- **Why it matters:** A Vite upgrade could silently break inspector auto-loading.
- **Affected code path:** Inspector Vite plugin.
- **Root cause:** Path-based module identification instead of module resolution.
- **Recommended fix:** Use Vite's module resolution API or check for a known export/flag instead of a hardcoded path. Alternatively, document the Vite version compatibility.
- **Verification:** Test with multiple Vite versions if possible.

---

## Remediation Plan

### Step 1: Fix validation plugin state restoration on patch throw (Finding 1)

- **Rationale:** This is a correctness bug that can leave stores in an inconsistent state. It's a small, surgical fix.
- **Implementation:** Wrap `originalPatch(patch)` in a try/catch in `src/lib/validation/plugin.svelte.ts:69`. On catch, call `restoreSnapshot()` and re-throw.
- **Tests:** Add a regression test in `src/lib/validation.spec.ts`: define a store with `validate`, call `$patch((state) => { state.a = 1; throw new Error('boom'); })`, assert `state.a` is unchanged.
- **Docs:** No doc changes needed.
- **Rollback:** Revert the single try/catch addition.

### Step 2: Document setup store getter+setter limitations (Finding 2, 17)

- **Rationale:** This is a design limitation that needs documentation, not a code fix. Users need to know before they model state with classes.
- **Implementation:** Update `README.md`, `skills/stately/SKILL.md`, and `docs/guide/define-store.md` to document: (a) class methods → actions; (b) getter-only properties → live getters (re-invoked); (c) getter+setter pairs → snapshotted once, original setter not invoked.
- **Tests:** Add a test documenting the current behavior (getter+setter pair: setter not called).
- **Docs:** Primary deliverable.
- **Rollback:** Revert doc changes.

### Step 3: Document and type async plugin return type widening (Finding 3, 16)

- **Rationale:** Users need to know that `drop`/`enqueue`/`dedupe` actions may resolve to `undefined`.
- **Implementation:** (a) Add a "Return Type Considerations" section to `docs/reference/async.md` and `docs/guide/...`; (b) Add a type test in `src/lib/types.test-d.ts` asserting the widened return type.
- **Tests:** Type test.
- **Docs:** Async plugin docs.
- **Rollback:** Revert doc and type test changes.

### Step 4: Move `@lucide/svelte` to optional/peer dependency (Finding 14)

- **Rationale:** Reduces install footprint for non-inspector users.
- **Implementation:** Move `@lucide/svelte` from `dependencies` to `peerDependencies` with `optionalDependencies` fallback, or to `optionalDependencies`. Update `package.json`. Verify the inspector still works when `@lucide/svelte` is installed.
- **Tests:** Run `pnpm run build` and verify the inspector chunk still includes icons. Run `pnpm pack` and inspect the tarball.
- **Docs:** Update installation docs to mention the optional inspector dependency.
- **Rollback:** Move back to `dependencies`.

### Step 5: Surface storage `QuotaExceededError` to users (Finding 13)

- **Rationale:** Silent data loss is a HIGH severity issue.
- **Implementation:** In `src/lib/persistence/adapters/local-storage.ts` and `session-storage.ts`, re-throw the `QuotaExceededError` instead of silently returning. The persistence plugin's `flush()` will catch it via `handleFlushError`, which calls `onError` or logs. Add a `console.warn` in non-production as a belt-and-suspenders measure.
- **Tests:** Add a test mocking `setItem` to throw `QuotaExceededError`; assert the persistence plugin's `onError` callback is invoked.
- **Docs:** Document that `onError` is the recommended way to handle quota errors.
- **Rollback:** Revert to silent swallow.

### Step 6: Add dev-mode warnings for sync error swallowing (Finding 6)

- **Rationale:** Silent sync failures are hard to debug.
- **Implementation:** In `src/lib/sync/plugin.svelte.ts:190-192` and `221-223`, add `console.warn` guarded by `import.meta.env.DEV` (or `typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'`).
- **Tests:** Add a test triggering a sync error; assert `console.warn` is called.
- **Docs:** No doc changes.
- **Rollback:** Remove the warnings.

### Step 7: Optimize history and timeline trimming (Finding 9)

- **Rationale:** O(n²) trimming is a performance concern for large limits.
- **Implementation:** In `src/lib/history/history-controller.svelte.ts:42-46` and `src/lib/runtime/devtools-timeline.svelte.ts:27-30`, replace `while (entries.length > limit) { entries.shift(); }` with `const overflow = entries.length - limit; if (overflow > 0) entries.splice(0, overflow);`. Adjust `state.index` in the history controller by `Math.min(state.index, overflow)` reduction.
- **Tests:** Add a performance test with `limit: 1000` and 10,000 mutations; verify sub-linear trim time.
- **Docs:** No doc changes.
- **Rollback:** Revert to `shift()` loop.

### Step 8: Replace `process.env.NODE_ENV` with `import.meta.env.DEV` (Finding 22)

- **Rationale:** Ensures dev warnings fire in Vite browser dev mode.
- **Implementation:** In `src/lib/runtime/store-shell.svelte.ts:171`, replace `typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'` with `import.meta.env.DEV` (Vite) with a fallback for non-Vite environments. Or use a helper function `isDev()` that checks both.
- **Tests:** Manual: run `pnpm run dev`, create a store with a native `Map`, verify the warning appears in the browser console.
- **Docs:** No doc changes.
- **Rollback:** Revert to `process.env` check.

### Step 9: Add `$onDispose` lifecycle hook (Finding 5)

- **Rationale:** Formalizes plugin cleanup and removes fragile `$dispose` chaining.
- **Implementation:** Add a `$onDispose(callback)` method to the store shell (`src/lib/runtime/store-shell.svelte.ts`). Maintain an internal array of cleanup callbacks. In `$dispose`, call them in LIFO order. Refactor persistence, history, and sync plugins to use `$onDispose` instead of overriding `$dispose`.
- **Tests:** Add a test with multiple plugins; assert cleanup order and that all callbacks fire.
- **Docs:** Update plugin authoring docs to recommend `$onDispose`.
- **Rollback:** Revert to `$dispose` override pattern.

### Step 10: Reduce `any` usage in core library files (Finding 7)

- **Rationale:** Aligns with the project's own TypeScript guidelines and the code-review skill's zero-`any` rule.
- **Implementation:** Replace `AnyFunction = (...args: any[]) => unknown` with `(...args: unknown[]) => unknown` in 8 core files. Replace `any` in `utils.ts` conditional types with `unknown`. For `StateManagerPlugin<any, any, any>[]` in `create-state-manager.ts:30`, add a comment justifying the `any` (heterogeneous plugin storage) if `unknown` doesn't work.
- **Tests:** Run `pnpm run check` and `pnpm run test` — all should pass.
- **Docs:** No doc changes.
- **Rollback:** Revert to `any`.

### Step 11: Fix knip configuration (Finding 19)

- **Rationale:** Ensures knip catches real unused code.
- **Implementation:** (a) Remove `export` from genuinely internal types (`InternalFfmController`, `MutationCommit`, `StoreShellBuilder`, `DeserializeResult`, `DeserializeSuccess`, `DeserializeFailure`); (b) Add `@public` JSDoc tags to legitimate public types re-exported via `index.ts`; (c) Add shadcn utility types to knip ignore list.
- **Tests:** Run `pnpm run knip` — should pass with 0 unused exports.
- **Docs:** No doc changes.
- **Rollback:** Revert exports.

### Step 12: Fix prettier deprecation warning (Finding 21)

- **Rationale:** Prevents future formatting breakage.
- **Implementation:** In `prettier.config.js:13`, remove `svelteBracketNewLine: false` (deprecated). Check if the behavior is already covered by `bracketSameLine: true` in the root config. Run `pnpm run format` to verify no formatting changes.
- **Tests:** Run `pnpm run lint` — no deprecation warning.
- **Docs:** No doc changes.
- **Rollback:** Re-add the option.

### Step 13: Add `engines` to published package.json (Finding 15)

- **Rationale:** Ensures consumers on Node < 20 get a warning.
- **Implementation:** In `scripts/write-dist-package.js`, add `engines` to the destructuring and to `distPackage`.
- **Tests:** Run `pnpm run build` and inspect `dist/package.json` for `engines`.
- **Docs:** No doc changes.
- **Rollback:** Remove `engines` from `distPackage`.

### Step 14: Add regression tests for edge cases (Finding 26)

- **Rationale:** Prevents regression of the identified issues.
- **Implementation:** Add tests per the verification steps in Findings 1, 2, 3, 4, 12, 13.
- **Tests:** Primary deliverable.
- **Docs:** No doc changes.
- **Rollback:** Remove tests.

### Step 15: Improve sync robustness (Finding 12)

- **Rationale:** Defense in depth against prototype pollution via custom transports.
- **Implementation:** In `src/lib/sync/plugin.svelte.ts:138`, replace `Reflect.get(remote, key)` with `Object.getOwnPropertyDescriptor(remote, key)?.value` to avoid invoking getters.
- **Tests:** Add a test with a malicious object that has a getter on a known key; assert the getter is not invoked.
- **Docs:** No doc changes.
- **Rollback:** Revert to `Reflect.get`.

---

## Verification Checklist

- [x] `pnpm run check` passes (0 errors, 0 warnings)
- [x] `pnpm run lint` passes (1 deprecation warning — Finding 21)
- [x] `pnpm run test` passes (297/297 server + typecheck tests; Playwright browser project skipped due to environment)
- [x] `pnpm run build` passes (publint: "All good!")
- [ ] `pnpm run knip` passes (currently fails — Finding 19)
- [x] No `any` types in public API (some `any` in internal helpers — Finding 7)
- [x] No `@ts-ignore` without justification (all `@ts-expect-error` are intentional type tests)
- [x] SSR safety: `getDefaultStateManager()` throws on SSR; request-scoped managers via context
- [x] Persistence treats payloads as untrusted (`sanitizeValue` applied)
- [x] Sync validates inbound messages (`validateSyncMessage`)
- [x] Sync ignores self-originated messages
- [x] Time-travel replay suppresses persistence and sync side effects
- [x] `$dispose()` clears subscriptions; plugins clean up external resources
- [x] Svelte 5 runes used correctly (`.svelte.ts` files for rune usage)
- [x] `$state.snapshot()` used for serialization
- [x] `structuredClone($state.snapshot(x))` for immutable snapshots

---

## Final Recommendation

**APPROVE AFTER FIXES**

The `@selfagency/stately` codebase is well-architected, well-tested (297 tests), and meets a high quality bar. All automated checks pass except `knip` (configuration issue). The review found **no CRITICAL issues**.

The **HIGH severity** findings (1, 2, 3, 13, 14) should be addressed before the next release:

- Finding 1 (validation state restoration) is a correctness bug with a surgical fix.
- Findings 2 and 3 (setup store semantics, async return types) are design limitations that need documentation at minimum.
- Finding 13 (silent quota errors) is a data-loss risk.
- Finding 14 (`@lucide/svelte` dependency) is a packaging issue affecting all consumers.

The **MEDIUM severity** findings (4, 5, 6, 7, 9, 10, 11, 16, 17, 20, 26) should be addressed in a follow-up release. They represent robustness, performance, and developer-experience improvements.

The **LOW severity** findings (8, 12, 15, 18, 19, 21, 22, 23, 24, 25, 29) are nice-to-have improvements and documentation gaps.

The library is **safe to use today** for users who:

1. Use option stores or setup stores with plain objects (not class instances with accessor pairs).
2. Provide an `onError` callback to persistence if they care about write failures.
3. Handle `undefined` returns from async-wrapped actions with `drop`/`enqueue`/`dedupe` policies.
4. Don't rely on `knip` passing in their own pipeline.

The remediation plan above provides 15 ordered steps with implementation guidance, tests, and rollback considerations for each finding.
