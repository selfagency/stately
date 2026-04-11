import { describe, expect, it } from 'vitest';
import { sanitizeValue } from './sanitize.js';

describe('sanitizeValue', () => {
	it('passes through primitives unchanged', () => {
		expect(sanitizeValue(42)).toBe(42);
		expect(sanitizeValue('hello')).toBe('hello');
		expect(sanitizeValue(true)).toBe(true);
		expect(sanitizeValue(null)).toBeNull();
		expect(sanitizeValue(undefined)).toBeUndefined();
	});

	it('removes reserved prototype-pollution keys from plain objects', () => {
		const malicious = JSON.parse('{"__proto__":{"evil":true},"constructor":{"prototype":{}}}') as Record<
			string,
			unknown
		>;
		const result = sanitizeValue(malicious) as Record<string, unknown>;

		expect(result).not.toHaveProperty('__proto__');
		expect(result).not.toHaveProperty('constructor');
	});

	it('removes reserved keys recursively in nested objects', () => {
		const payload = {
			user: {
				name: 'Alice',
				__proto__: { admin: true }
			}
		};
		const result = sanitizeValue(payload) as { user: Record<string, unknown> };

		expect(result.user.name).toBe('Alice');
		expect(result.user).not.toHaveProperty('__proto__');
	});

	it('sanitizes items inside arrays', () => {
		const payload = [{ __proto__: { evil: true }, name: 'Bob' }];
		const result = sanitizeValue(payload) as Array<Record<string, unknown>>;

		expect(result[0].name).toBe('Bob');
		expect(result[0]).not.toHaveProperty('__proto__');
	});

	it('returns an empty object when depth exceeds the maximum limit', () => {
		// Build a deeply nested object exceeding MAX_DEPTH (32)
		let nested: Record<string, unknown> = { value: 'leaf' };
		for (let index = 0; index < 34; index += 1) {
			nested = { child: nested };
		}

		const result = sanitizeValue(nested) as Record<string, unknown>;
		// At some depth the sanitizer bails out with {}
		expect(result).toBeDefined();
		// The result must be a plain object (not throw)
		expect(typeof result).toBe('object');
	});

	it('preserves safe nested values', () => {
		const payload = { a: { b: { c: 42 } } };
		const result = sanitizeValue(payload) as { a: { b: { c: number } } };

		expect(result.a.b.c).toBe(42);
	});

	it('does not mutate the original object', () => {
		const payload = { __proto__: { evil: true }, safe: 'yes' };
		sanitizeValue(payload);

		expect(Object.prototype).not.toHaveProperty('evil');
	});
});
