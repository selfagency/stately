/**
 * Read a symbol-keyed marker from any value without the `as unknown as Record<symbol, T>` ceremony.
 */
export function readMarker<T>(target: unknown, marker: symbol): T | undefined {
  return (target as Record<symbol, T | undefined>)[marker];
}

/**
 * Write a symbol-keyed marker onto any value without the `as unknown as Record<symbol, T>` ceremony.
 */
export function writeMarker<T>(target: unknown, marker: symbol, value: T): void {
  (target as Record<symbol, T>)[marker] = value;
}
