import { describe, expect, it } from 'vitest';
import { deserializePersistedState, serializePersistedState } from './serialize.js';

describe('persistence serialization', () => {
	it('serializes snapshots and safely deserializes migrated envelopes', () => {
		const serialized = serializePersistedState({
			state: { count: 2 },
			version: 2
		});

		expect(JSON.parse(serialized)).toEqual({ version: 2, state: { count: 2 } });
		expect(
			deserializePersistedState<{ count: number }>(serialized, {
				version: 2
			})
		).toEqual({ version: 2, state: { count: 2 } });
		expect(
			deserializePersistedState<{ count: number }>(
				JSON.stringify({ version: 1, state: { count: 1 } }),
				{
					version: 2,
					migrate(state, fromVersion) {
						return {
							count: (typeof state.count === 'number' ? state.count : 0) + fromVersion
						};
					}
				}
			)
		).toEqual({ version: 2, state: { count: 2 } });
		expect(
			deserializePersistedState<{ count: number }>('not-json', {
				version: 2
			})
		).toBeUndefined();
		expect(
			deserializePersistedState<{ count: number }>(JSON.stringify({ version: 2, state: null }), {
				version: 2
			})
		).toBeUndefined();
	});
});
