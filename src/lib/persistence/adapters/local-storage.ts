import type { PersistenceAdapter } from '../types.js';
import { reportStatelyInspectorNotice } from '../../inspector/notice.js';

interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
	clear(): void;
	key(index: number): string | null;
	readonly length: number;
}

function resolveLocalStorage(storage?: StorageLike): StorageLike | undefined {
	if (storage) {
		return storage;
	}

	if (typeof globalThis.localStorage !== 'undefined') {
		return globalThis.localStorage as StorageLike;
	}

	return undefined;
}

export function createLocalStorageAdapter(storage?: StorageLike): PersistenceAdapter {
	const explicitStorage = storage;

	function getStorage(): StorageLike | undefined {
		return resolveLocalStorage(explicitStorage);
	}

	return {
		async getItem(key) {
			return getStorage()?.getItem(key) ?? null;
		},
		async setItem(key, value) {
			const s = getStorage();
			if (!s) return;
			try {
				s.setItem(key, value);
			} catch (error) {
				if (error instanceof DOMException && error.name === 'QuotaExceededError') {
					reportStatelyInspectorNotice(`localStorage quota exceeded for key "${key}".`);
					return;
				}
				throw error;
			}
		},
		async removeItem(key) {
			getStorage()?.removeItem(key);
		},
		async clear() {
			getStorage()?.clear();
		},
		async keys() {
			const s = getStorage();
			if (!s) return [];
			return Array.from({ length: s.length }, (_, index) => s.key(index)).filter(
				(value): value is string => value !== null
			);
		}
	};
}
