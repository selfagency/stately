# Persistence helpers

Durability, properly archived.
This page covers the persistence-specific helpers, option types, and adapter contracts
used by `createPersistencePlugin()`.

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
- `pick` — persist only the listed state keys
- `omit` — persist every state key except the listed ones
- `compression` — optional compressor/decompressor
- `serialize` — optional custom serializer
- `deserialize` — optional custom deserializer
- `migrate` — optional version migration function used by the built-in deserializer path
- `onError` — callback for failed auto-flush writes
- `debounce` — trailing-edge delay for automatic writes
- `ttl` — discard persisted state older than the configured age in milliseconds

`pick` and `omit` are mutually exclusive. Stately enforces that rule both in the types and at runtime.

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

### Selective persistence with `pick` and `omit`

Use `pick` when only a few fields should survive reloads:

```ts
persist: {
	adapter: createMemoryStorageAdapter(),
	version: 1,
	pick: ['theme', 'compact']
}
```

Use `omit` when most fields should persist and only a few should stay ephemeral:

```ts
persist: {
	adapter: createMemoryStorageAdapter(),
	version: 1,
	omit: ['token']
}
```

### Schema upgrades with `migrate`

Use `migrate` when the persisted shape changes between versions:

```ts
persist: {
	adapter: createMemoryStorageAdapter(),
	version: 2,
	migrate(state, fromVersion) {
		if (fromVersion === 1) {
			return {
				theme: state.theme ?? 'dark',
				compact: Boolean(state.compact)
			};
		}

		return {
			theme: 'dark',
			compact: false
		};
	}
}
```

`migrate` only applies when you use the built-in deserializer path.
If you provide a fully custom `deserialize()`, your custom function owns the
migration logic too.

### TTL expiry

Use `ttl` when persisted state should expire automatically:

```ts
persist: {
	adapter: createMemoryStorageAdapter(),
	version: 1,
	ttl: 60_000
}
```

When `ttl` is set, Stately wraps the persisted payload in a timestamp envelope.
If that timestamp is too old when the store rehydrates, the persisted state is
discarded and the store falls back to its initial state.

### Debounced writes

Use `debounce` when the store mutates frequently and you want to reduce write pressure on the adapter:

```ts
persist: {
	adapter: createMemoryStorageAdapter(),
	version: 1,
	debounce: 250
}
```

This is useful for draft editing, drag interactions, or other high-frequency updates.

## `PersistController`

The plugin exposes a controller on each persisted store as `$persist`.

- `ready` resolves after the initial rehydration attempt
- `flush()` writes the current snapshot immediately
- `rehydrate()` re-reads persisted state on demand
- `clear()` removes the stored snapshot
- `pause()` and `resume()` temporarily disable automatic writes

This is useful when you need to batch updates or recover from a storage failure without tearing down the store.

During history replay, persistence writes are intentionally suppressed so you do
not overwrite current durable state with historical snapshots.

## Public persistence types

The persistence module also exports `PersistEnvelope` and
`PersistCompression` so consumers can type custom serializers, migrations, or
storage bridges without guessing at the shape.

## Related pages

- [Plugins](/guide/plugins)
- [SSR and SvelteKit](/guide/ssr-and-sveltekit)
- [Plugins and orchestration](/reference/plugins)
