const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 32;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function sanitizeValue<T>(value: T, depth = 0): T {
  if (depth > MAX_DEPTH) {
    return {} as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (blockedKeys.has(key)) {
      continue;
    }
    sanitized[key] = sanitizeValue(nestedValue, depth + 1);
  }

  return sanitized as T;
}
