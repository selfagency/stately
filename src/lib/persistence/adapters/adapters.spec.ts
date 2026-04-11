import { describe, expect, it } from 'vitest';
import { createIndexedDbAdapter } from './indexeddb.js';
import { createLocalStorageAdapter } from './local-storage.js';
import { createMemoryStorageAdapter } from './memory-storage.js';
import { createSessionStorageAdapter } from './session-storage.js';

function createStorageLike() {
	const map = new Map<string, string>();
	return {
		getItem(key: string) {
			return map.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			map.set(key, value);
		},
		removeItem(key: string) {
			map.delete(key);
		},
		clear() {
			map.clear();
		},
		key(index: number) {
			return [...map.keys()][index] ?? null;
		},
		get length() {
			return map.size;
		}
	};
}

describe('persistence adapters', () => {
	it('supports memory, localStorage, and sessionStorage adapters', async () => {
		const memory = createMemoryStorageAdapter();
		await memory.setItem('one', '1');
		expect(await memory.getItem('one')).toBe('1');
		expect(await memory.keys?.()).toEqual(['one']);
		await memory.clear?.();
		expect(await memory.getItem('one')).toBeNull();

		const localStorage = createStorageLike();
		const local = createLocalStorageAdapter(localStorage);
		await local.setItem('two', '2');
		expect(await local.getItem('two')).toBe('2');
		expect(await local.keys?.()).toEqual(['two']);

		const sessionStorage = createStorageLike();
		const session = createSessionStorageAdapter(sessionStorage);
		await session.setItem('three', '3');
		expect(await session.getItem('three')).toBe('3');
		expect(await session.keys?.()).toEqual(['three']);
	});

	it('supports indexeddb-style async operations', async () => {
		const records = new Map<string, string>();
		const adapter = createIndexedDbAdapter({
			async get(key) {
				return records.get(key) ?? null;
			},
			async set(key, value) {
				records.set(key, value);
			},
			async delete(key) {
				records.delete(key);
			},
			async clear() {
				records.clear();
			},
			async keys() {
				return [...records.keys()];
			}
		});

		await adapter.setItem('alpha', 'a');
		await adapter.setItem('beta', 'b');
		expect(await adapter.getItem('alpha')).toBe('a');
		expect(await adapter.keys?.()).toEqual(['alpha', 'beta']);
		await adapter.removeItem('alpha');
		expect(await adapter.getItem('alpha')).toBeNull();
		await adapter.clear?.();
		expect(await adapter.keys?.()).toEqual([]);
	});
});
