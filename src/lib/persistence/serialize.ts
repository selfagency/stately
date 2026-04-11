import type { PersistDeserializeOptions, PersistEnvelope } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function serializePersistedState<State>(envelope: PersistEnvelope<State>): string {
	return JSON.stringify(envelope);
}

export function deserializePersistedState<State>(
	raw: string,
	options: PersistDeserializeOptions<State>
): PersistEnvelope<State> | undefined {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return undefined;
	}

	if (!isRecord(parsed) || typeof parsed.version !== 'number' || !isRecord(parsed.state)) {
		return undefined;
	}

	if (parsed.version === options.version) {
		return {
			version: options.version,
			state: parsed.state as State
		};
	}

	if (!options.migrate) {
		return undefined;
	}

	return {
		version: options.version,
		state: options.migrate(parsed.state, parsed.version)
	};
}
