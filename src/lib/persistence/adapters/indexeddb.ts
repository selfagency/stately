import type { PersistenceAdapter } from '../types.js';

interface IndexedDbLike {
	get(key: string): Promise<string | null>;
	set(key: string, value: string): Promise<void>;
	delete(key: string): Promise<void>;
	clear(): Promise<void>;
	keys(): Promise<string[]>;
}

export function createIndexedDbAdapter(database: IndexedDbLike): PersistenceAdapter {
	return {
		getItem(key) {
			return database.get(key);
		},
		setItem(key, value) {
			return database.set(key, value);
		},
		removeItem(key) {
			return database.delete(key);
		},
		clear() {
			return database.clear();
		},
		keys() {
			return database.keys();
		}
	};
}
