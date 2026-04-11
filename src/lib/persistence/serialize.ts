import type { PersistDeserializeOptions, PersistEnvelope } from './types.js';
import { sanitizeValue } from '../internal/sanitize.js';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export interface DeserializeSuccess<State> {
	ok: true;
	envelope: PersistEnvelope<State>;
}

export interface DeserializeFailure {
	ok: false;
	error: string;
}

export type DeserializeResult<State> = DeserializeSuccess<State> | DeserializeFailure;

export function serializePersistedState<State>(envelope: PersistEnvelope<State>): string {
	return JSON.stringify(envelope);
}

export function deserializePersistedState<State>(
	raw: string,
	options: PersistDeserializeOptions<State>
): DeserializeResult<State> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { ok: false, error: 'Invalid JSON in persisted state.' };
	}

	if (!isRecord(parsed) || typeof parsed.version !== 'number' || !isRecord(parsed.state)) {
		return { ok: false, error: 'Malformed persistence envelope: missing version or state.' };
	}

	if (parsed.version === options.version) {
		return {
			ok: true,
			envelope: {
				version: options.version,
				state: sanitizeValue(parsed.state) as State
			}
		};
	}

	if (!options.migrate) {
		return {
			ok: false,
			error: `Version mismatch: stored v${parsed.version}, expected v${options.version}. No migrate function provided.`
		};
	}

	try {
		return {
			ok: true,
			envelope: {
				version: options.version,
				state: sanitizeValue(options.migrate(parsed.state, parsed.version))
			}
		};
	} catch (e) {
		return {
			ok: false,
			error: `Migration from v${parsed.version} failed: ${e instanceof Error ? e.message : String(e)}`
		};
	}
}
