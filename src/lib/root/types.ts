export interface StoreDefinition<Id extends string = string, Options = unknown, Store = unknown> {
	readonly $id: Id;
	readonly options?: Options;
	readonly create?: (manager: StateManager) => Store;
}

export interface StateManagerPluginContext<Definition extends StoreDefinition = StoreDefinition, Store = unknown> {
	readonly manager: StateManager;
	readonly definition: Definition;
	readonly options: Definition['options'];
	readonly store: Store;
}

type DefaultPluginAugmentation<Store> = Store extends object ? Partial<Store> : Record<PropertyKey, unknown>;

export type StateManagerPlugin<
	Definition extends StoreDefinition = StoreDefinition,
	Store = unknown,
	Augmentation extends object = DefaultPluginAugmentation<Store>
> = (context: StateManagerPluginContext<Definition, Store>) => void | Augmentation;

export type TypedStateManagerPlugin<
	Definition extends StoreDefinition = StoreDefinition,
	Store = unknown,
	Augmentation extends object = DefaultPluginAugmentation<Store>
> = StateManagerPlugin<Definition, Store, Augmentation>;

export function defineStateManagerPlugin<
	Definition extends StoreDefinition = StoreDefinition,
	Store = unknown,
	Augmentation extends object = DefaultPluginAugmentation<Store>
>(
	plugin: TypedStateManagerPlugin<Definition, Store, Augmentation>
): TypedStateManagerPlugin<Definition, Store, Augmentation> {
	return plugin;
}

export interface StateManager {
	readonly plugins: readonly StateManagerPlugin[];
	use<
		Definition extends StoreDefinition = StoreDefinition,
		Store = unknown,
		Augmentation extends object = DefaultPluginAugmentation<Store>
	>(
		plugin: StateManagerPlugin<Definition, Store, Augmentation>
	): StateManager;
	register(definition: StoreDefinition): void;
	hasDefinition(id: string): boolean;
	getDefinition<Definition extends StoreDefinition = StoreDefinition>(id: string): Definition | undefined;
	hasStore(id: string): boolean;
	getStore<Store = unknown>(id: string): Store | undefined;
	createStore<Definition extends StoreDefinition, Store extends object>(
		definition: Definition,
		factory: () => Store
	): Store;
	deleteStore(id: string): boolean;
	clear(): void;
}
