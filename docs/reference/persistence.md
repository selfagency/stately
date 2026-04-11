# Persistence helpers

This page covers the persistence-specific helpers, option types, and adapter contracts used by `createPersistencePlugin()`.

## Persistence adapter contract

`PersistenceAdapter` is the shape the plugin expects for storage backends.

- `getItem(key)` reads a stored snapshot and returns `null` when missing.
- `setItem(key, value)` writes the encoded snapshot.
- `removeItem(key)` deletes a stored snapshot.
- `clear?()` and `keys?()` are optional convenience methods for richer backends.

### Built-in adapters

- `createLocalStorageAdapter(storage?)` for browser `localStorage` or a custom storage-like object
- `createSessionStorageAdapter(storage?)` for browser `sessionStorage` or a custom storage-like object
- `createMemoryStorageAdapter()` for tests and server-side fallback storage
- `createIndexedDbAdapter(database)` for async databases that already expose `get`, `set`, `delete`, `clear`, and `keys`

The browser adapters gracefully handle missing storage and quota errors.

## Compression helpers

`createLzStringCompression()` returns a `PersistCompression` implementation
that prefixes encoded values with `lz:` and decodes them with `lz-string`.

Use compression when persisted state is large enough to justify the encoding overhead.

## `PersistOptions`

`PersistOptions` configures how a store is hydrated and flushed.

Important fields:

- `adapter` — required storage backend
- `version` — required finite version number
- `key` — optional storage key, defaults to the store id
- `compression` — optional compressor/decompressor
- `serialize` — optional custom serializer
- `deserialize` — optional custom deserializer
- `migrate` — optional version migration function used by the built-in deserializer path

Example:

```ts
import {
	createMemoryStorageAdapter,
	createPersistencePlugin,
	createStateManager,
	defineStore
} from '@selfagency/stately';

const manager = createStateManager().use(createPersistencePlugin());

export const usePreferencesStore = defineStore('preferences', {
	state: () => ({ theme: 'dark', compact: false }),
	persist: {
		adapter: createMemoryStorageAdapter(),
		version: 1,
		key: 'stately:preferences'
	}
});
```

## `PersistController`

The plugin exposes a controller on each persisted store as `$persist`.

- `ready` resolves after the initial rehydration attempt
- `flush()` writes the current snapshot immediately
- `rehydrate()` re-reads persisted state on demand
- `clear()` removes the stored snapshot
- `pause()` and `resume()` temporarily disable automatic writes

This is useful when you need to batch updates or recover from a storage failure without tearing down the store.

## Public persistence types

The persistence module also exports `PersistEnvelope` and
`PersistCompression` so consumers can type custom serializers, migrations, or
storage bridges without guessing at the shape.
