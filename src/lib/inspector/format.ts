function createReplacer() {
  const seen = new WeakSet<object>();

  return (_key: string, value: unknown) => {
    if (typeof value === 'bigint') {
      return `${value.toString()}n`;
    }

    if (typeof value === 'function') {
      return `[Function ${value.name || 'anonymous'}]`;
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }

    return value;
  };
}

export function formatInspectorValue(value: unknown): string {
  return JSON.stringify(value, createReplacer(), 2) ?? 'null';
}
