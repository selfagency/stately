export interface StoreDefinition<Id extends string = string, Options = unknown, Store = unknown> {
	readonly $id: Id;
	readonly options?: Options;
	readonly create?: (manager: StateManager) => Store;
}

export interface StateManagerPluginContext<
	Definition extends StoreDefinition = StoreDefinition,
	Store = unknown
> {
	readonly manager: StateManager;
	readonly definition: Definition;
	readonly options: Definition['options'];
	readonly store: Store;
}

export type StateManagerPlugin<
	Definition extends StoreDefinition = StoreDefinition,
	Store = unknown
> = (context: StateManagerPluginContext<Definition, Store>) => void | Partial<Store>;

export interface StateManager {
	readonly plugins: readonly StateManagerPlugin[];
	use(plugin: StateManagerPlugin): StateManager;
	register(definition: StoreDefinition): void;
	hasDefinition(id: string): boolean;
	getDefinition<Definition extends StoreDefinition = StoreDefinition>(
		id: string
	): Definition | undefined;
	hasStore(id: string): boolean;
	getStore<Store = unknown>(id: string): Store | undefined;
	createStore<Definition extends StoreDefinition, Store extends object>(
		definition: Definition,
		factory: () => Store
	): Store;
	deleteStore(id: string): boolean;
	clear(): void;
}
