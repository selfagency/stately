import type { PersistenceAdapter } from '../types.js';

interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
	clear(): void;
	key(index: number): string | null;
	readonly length: number;
}

function resolveLocalStorage(storage?: StorageLike): StorageLike {
	if (storage) {
		return storage;
	}

	if (typeof globalThis.localStorage === 'undefined') {
		throw new Error(
			'localStorage is not available in this environment. Pass an explicit storage implementation.'
		);
	}

	return globalThis.localStorage as StorageLike;
}

export function createLocalStorageAdapter(storage?: StorageLike): PersistenceAdapter {
	const resolvedStorage = resolveLocalStorage(storage);

	return {
		async getItem(key) {
			return resolvedStorage.getItem(key);
		},
		async setItem(key, value) {
			resolvedStorage.setItem(key, value);
		},
		async removeItem(key) {
			resolvedStorage.removeItem(key);
		},
		async clear() {
			resolvedStorage.clear();
		},
		async keys() {
			return Array.from({ length: resolvedStorage.length }, (_, index) =>
				resolvedStorage.key(index)
			).filter((value): value is string => value !== null);
		}
	};
}
