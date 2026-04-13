import type { SyncMessage } from './types.js';

function isObject(value: unknown): value is object {
	return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function validateSyncMessage(value: unknown): value is SyncMessage<object> {
	if (!isObject(value)) {
		return false;
	}

	return (
		typeof Reflect.get(value, 'storeId') === 'string' &&
		(Reflect.get(value, 'storeId') as string).length > 0 &&
		typeof Reflect.get(value, 'origin') === 'string' &&
		(Reflect.get(value, 'origin') as string).length > 0 &&
		isPositiveInteger(Reflect.get(value, 'version')) &&
		isPositiveInteger(Reflect.get(value, 'mutationId')) &&
		typeof Reflect.get(value, 'timestamp') === 'number' &&
		Number.isFinite(Reflect.get(value, 'timestamp') as number) &&
		isObject(Reflect.get(value, 'state'))
	);
}

export function parseSyncMessage(value: unknown): SyncMessage<object> | undefined {
	return validateSyncMessage(value) ? value : undefined;
}
