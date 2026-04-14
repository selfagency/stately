# Validation

Use this plugin when a store should reject invalid state immediately after a patch runs.

This is a good fit for forms, constrained editors, and domain state with
invariants that should never survive past the current mutation.

## Before you begin

Add the plugin to the manager that owns the store:

```ts
import { createStateManager, createValidationPlugin } from '@selfagency/stately';

const manager = createStateManager().use(createValidationPlugin());
```

## Add validation to a store

Define `validate` on the store options:

```ts
import { defineStore } from '@selfagency/stately';

export const useProfileStore = defineStore('profile', {
  state: () => ({ name: '', age: 18 }),
  validate(state) {
    if (!state.name.trim()) {
      return 'Name is required';
    }

    if (state.age < 13) {
      return 'Age must be at least 13';
    }

    return true;
  }
});
```

`state` is inferred from the actual store definition, so interface-based option
stores keep their full property types inside `validate()` too.

Validation runs after `$patch()` applies the mutation.

## What happens on success and failure

Validation outcomes work like this:

- return `true` or `undefined` — accept the patch
- return `false` — roll back the patch, call `onValidationError` if present, and throw `Error('Validation failed')`
- return a string — roll back the patch, call `onValidationError` if present, and throw an `Error` with that message
- throw from `validate()` — roll back the patch and rethrow the original error

That rollback behavior is important: invalid state does not remain in the store after validation fails.

## Handle validation errors explicitly

Use `onValidationError` when the UI needs a side effect before the error is thrown:

```ts
export const useProfileStore = defineStore('profile', {
  state: () => ({ name: '', age: 18 }),
  validate(state) {
    if (!state.name.trim()) {
      return 'Name is required';
    }

    return true;
  },
  onValidationError(message) {
    console.error(message);
  }
});
```

Typical uses:

- set a toast or banner message
- map a failure into form error UI
- capture diagnostics before the thrown error reaches higher-level code

## When validation belongs here

Use the plugin when:

- the rule is about the resulting store state
- invalid state should be rolled back automatically
- you want the invariant enforced for every patch path

Use action guards or regular action code instead when the rule is about whether
an action should run at all, especially if the decision depends more on the
action input than on the final state.

## Related pages

- [Define stores](/guide/define-store)
- [Validation reference](/reference/validation)
- [Plugins](/guide/plugins)
