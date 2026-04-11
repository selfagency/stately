import { describe, expect, it } from 'vitest';
import { createLzStringCompression } from './lz-string.js';

describe('lz-string compression', () => {
	it('round-trips persisted payloads and rejects invalid compressed input safely', () => {
		const compression = createLzStringCompression();
		const payload = JSON.stringify({ version: 1, state: { count: 3 } });
		const compressed = compression.compress(payload);

		expect(typeof compressed).toBe('string');
		expect(compression.decompress(compressed)).toBe(payload);
		expect(compression.decompress('definitely-not-valid-compressed-data')).toBeUndefined();
	});
});
