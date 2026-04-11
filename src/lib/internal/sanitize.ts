const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

export function sanitizeValue<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => sanitizeValue(item)) as T;
	}

	if (!isPlainObject(value)) {
		return value;
	}

	const sanitized: Record<string, unknown> = {};
	for (const [key, nestedValue] of Object.entries(value)) {
		if (blockedKeys.has(key)) {
			continue;
		}
		sanitized[key] = sanitizeValue(nestedValue);
	}

	return sanitized as T;
}
