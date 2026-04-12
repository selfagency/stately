# Migration from Pinia

If you already know Pinia, Stately will feel familiar.
The main shift is that Stately is built for Svelte 5 runes and SvelteKit SSR rather than Vue refs.

## Mental model mapping

| Pinia concept                                 | Stately equivalent                      |
| --------------------------------------------- | --------------------------------------- |
| `defineStore(id, options)`                    | `defineStore(id, options)`              |
| setup stores                                  | `defineStore(id, { setup: () => ... })` |
| direct mutation                               | direct mutation                         |
| `$patch`, `$reset`, `$subscribe`, `$onAction` | same helper names                       |
| Pinia plugin setup                            | `createStateManager().use(plugin)`      |

## Main differences

- Use request-scoped managers in SSR instead of shared singletons.
- Keep advanced behavior opt-in through plugins.
- Setup stores can be plain objects or class instances; prototype getters/actions are supported.
- Use `storeToRefs()` when destructuring reactive properties, especially in setup stores.
- Avoid destructuring primitive store properties directly (`const { count } = store`) because it snapshots values.
