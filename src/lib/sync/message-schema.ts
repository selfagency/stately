import type { SyncMessage } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function validateSyncMessage(value: unknown): value is SyncMessage<Record<string, unknown>> {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.storeId === 'string' &&
		value.storeId.length > 0 &&
		typeof value.origin === 'string' &&
		value.origin.length > 0 &&
		isPositiveInteger(value.version) &&
		isPositiveInteger(value.mutationId) &&
		typeof value.timestamp === 'number' &&
		Number.isFinite(value.timestamp) &&
		isRecord(value.state)
	);
}

export function parseSyncMessage(value: unknown): SyncMessage<Record<string, unknown>> | undefined {
	return validateSyncMessage(value) ? value : undefined;
}
