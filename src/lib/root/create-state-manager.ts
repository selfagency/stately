import type { StateManager, StateManagerPlugin, StateManagerPluginContext, StoreDefinition } from './types.js';

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function applyDescriptorAugmentation(target: object, source: object): void {
	const descriptors = Object.getOwnPropertyDescriptors(source);
	for (const [key, descriptor] of Object.entries(descriptors)) {
		Object.defineProperty(target, key, descriptor);
	}
}

export function createStateManager(): StateManager {
	const plugins: StateManagerPlugin[] = [];
	const definitions = new Map<string, StoreDefinition>();
	const stores = new Map<string, unknown>();

	const manager: StateManager = {
		get plugins() {
			return Object.freeze([...plugins]);
		},
		use(plugin) {
			plugins.push(plugin);
			return manager;
		},
		register(definition) {
			const existing = definitions.get(definition.$id);

			if (existing) {
				throw new Error(`Duplicate store definition registered for "${definition.$id}".`);
			}

			definitions.set(definition.$id, definition);
		},
		hasDefinition(id) {
			return definitions.has(id);
		},
		getDefinition<Definition extends StoreDefinition = StoreDefinition>(id: string) {
			return definitions.get(id) as Definition | undefined;
		},
		hasStore(id) {
			return stores.has(id);
		},
		getStore<Store = unknown>(id: string) {
			return stores.get(id) as Store | undefined;
		},
		createStore(definition, factory) {
			if (!definitions.has(definition.$id)) {
				manager.register(definition);
			} else if (definitions.get(definition.$id) !== definition) {
				throw new Error(`Duplicate store definition registered for "${definition.$id}".`);
			}

			const existing = stores.get(definition.$id);
			if (existing) {
				return existing as ReturnType<typeof factory>;
			}

			const store = factory();

			for (const plugin of plugins) {
				const context: StateManagerPluginContext<typeof definition, typeof store> = {
					manager,
					definition,
					options: definition.options,
					store
				};
				const augmentation = plugin(context);
				if (isObject(store) && isObject(augmentation)) {
					applyDescriptorAugmentation(store, augmentation);
				}
			}

			stores.set(definition.$id, store);
			return store;
		},
		deleteStore(id) {
			return stores.delete(id);
		},
		clear() {
			stores.clear();
			definitions.clear();
		}
	};

	return manager;
}

let defaultStateManager: StateManager | undefined;

/**
 * SPA-only convenience for consumers that do not need request-scoped state.
 * In SvelteKit SSR, prefer `createStateManager()` per request and provide it through context.
 *
 * @throws {Error} When called during SSR (no `window` global). Use `createStateManager()` with
 * Svelte context instead.
 */
export function getDefaultStateManager(): StateManager {
	if (typeof window === 'undefined') {
		throw new Error(
			'getDefaultStateManager() is not available during SSR. ' +
				'Use createStateManager() with Svelte context for request-scoped state. ' +
				'See: https://svelte.dev/docs/svelte/svelte-context'
		);
	}
	defaultStateManager ??= createStateManager();
	return defaultStateManager;
}

export function resetDefaultStateManager(): void {
	defaultStateManager = undefined;
}

export type { StateManager, StateManagerPlugin, StoreDefinition } from './types.js';
