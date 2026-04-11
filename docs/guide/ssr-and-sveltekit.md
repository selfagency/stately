# SSR and SvelteKit

Stately is designed to work with SvelteKit SSR safely, but the safety comes from how you create managers.
The recommended pattern is request-scoped manager creation plus Svelte context.

## SSR-safe pattern

Create a fresh manager inside a layout or server-driven boundary and provide it through context:

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

## SPA-only convenience

`getDefaultStateManager()` is available for browser-only usage.
Treat it as a convenience for SPAs, not as the default integration for SSR.

## Why this matters

Shared singleton state on the server can leak data between requests.
Request-scoped managers keep store instances isolated and make SSR behavior predictable.
