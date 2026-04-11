# SSR and SvelteKit

Stately is designed to work with SvelteKit SSR safely, but the safety comes from how you create managers.
The recommended pattern is request-scoped manager creation plus Svelte context.

## SSR-safe pattern

Create a fresh manager inside a layout or component boundary and provide it
through context:

```ts
import {
	createHistoryPlugin,
	createPersistencePlugin,
	createStateManager,
	initializeStateManagerContext
} from '@selfagency/stately';

const manager = createStateManager().use(createPersistencePlugin()).use(createHistoryPlugin());

initializeStateManagerContext(manager);
```

Read that manager where you instantiate stores:

```ts
import { getStateManager } from '@selfagency/stately';
import { useCounterStore } from '$lib/stores/counter.js';

const counter = useCounterStore(getStateManager());
```

The important rule is that each SSR request gets its own manager.
That keeps store state isolated and prevents one user’s data from leaking into
another user’s render.

## Browser-only convenience

`getDefaultStateManager()` is a browser-only convenience for SPA code.
Use it only when the app is not rendering through SSR.

```ts
import { getDefaultStateManager } from '@selfagency/stately';

const manager = getDefaultStateManager();
```

That is fine for client-only apps and demos.
It is not the right default for SvelteKit because it reuses process-wide state.

## Practical SvelteKit guidance

- Create the manager at the top of the request-owned tree.
- Provide it through context before any stores are instantiated.
- Avoid shared module-level singletons on the server.
- Keep persistence, sync, and browser APIs behind browser-only boundaries.

## Why this matters

Shared singleton state on the server can leak data between requests.
Request-scoped managers keep store instances isolated and make SSR behavior predictable.
