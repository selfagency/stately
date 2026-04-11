import { describe, expect, it } from 'vitest';
import { parseSyncMessage, validateSyncMessage } from './message-schema.js';

describe('sync message schema', () => {
	it('accepts well-formed sync messages and rejects malformed payloads', () => {
		const valid = {
			storeId: 'counter',
			origin: 'remote-origin',
			version: 1,
			mutationId: 2,
			timestamp: Date.now(),
			state: { count: 1 }
		};

		expect(validateSyncMessage(valid)).toBe(true);
		expect(parseSyncMessage(valid)).toEqual(valid);
		expect(validateSyncMessage({ ...valid, storeId: '' })).toBe(false);
		expect(validateSyncMessage({ ...valid, mutationId: 0 })).toBe(false);
		expect(validateSyncMessage({ ...valid, state: null })).toBe(false);
		expect(parseSyncMessage({ ...valid, timestamp: 'nope' })).toBeUndefined();
	});
});
