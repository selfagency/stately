# Migration from Pinia

If you already know Pinia, Stately should feel familiar.
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
- Use accessors or returned reactive values in setup stores so reactivity stays intact.
- Use `storeToRefs()` when destructuring reactive properties.
