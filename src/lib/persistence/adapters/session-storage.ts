import type { PersistenceAdapter } from '../types.js';

interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
	clear(): void;
	key(index: number): string | null;
	readonly length: number;
}

export function createSessionStorageAdapter(
	storage: StorageLike = sessionStorage
): PersistenceAdapter {
	return {
		async getItem(key) {
			return storage.getItem(key);
		},
		async setItem(key, value) {
			storage.setItem(key, value);
		},
		async removeItem(key) {
			storage.removeItem(key);
		},
		async clear() {
			storage.clear();
		},
		async keys() {
			return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
				(value): value is string => value !== null
			);
		}
	};
}
