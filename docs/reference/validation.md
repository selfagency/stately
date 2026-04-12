# Validation

The gates are well-documented.
This page covers the public validation surface exposed by `createValidationPlugin()`.

## `createValidationPlugin()`

`createValidationPlugin()` augments stores that declare validation options.

```ts
import { createStateManager, createValidationPlugin } from '@selfagency/stately';

const manager = createStateManager().use(createValidationPlugin());
```

The plugin wraps `$patch()` for matching stores.

## Store definition options

The plugin extends store definitions with:

```ts
validate?: (state: State) => boolean | string;
onValidationError?: (error: string) => void;
```

## Validation outcomes

Validation runs after the patch is applied.

- `true` — accept the patch
- `undefined` — accept the patch
- string — restore the previous snapshot, call `onValidationError` if present,
  then throw `Error(message)`
- throws — restore the previous snapshot, then rethrow the original error

## Rollback behavior

The plugin snapshots the store state before the patch runs.
If validation fails, it restores that earlier snapshot.

This makes validation a good fit for invariants that should never remain visible in the live store.

## Example

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
	},
	onValidationError(message) {
		console.error(message);
	}
});
```

## Related pages

- [Validation guide](/guide/validation)
- [Define stores](/guide/define-store)
- [Public types](/reference/types)
