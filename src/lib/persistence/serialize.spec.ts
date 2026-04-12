import { describe, expect, it } from 'vitest';
import { deserializePersistedState, serializePersistedState } from './serialize.js';

describe('persistence serialization', () => {
	it('serializes snapshots and safely deserializes migrated envelopes', () => {
		const serialized = serializePersistedState({
			state: { count: 2 },
			version: 2
		});

		expect(JSON.parse(serialized)).toEqual({ version: 2, state: { count: 2 } });
		const result = deserializePersistedState<{ count: number }>(serialized, { version: 2 });
		expect(result).toEqual({ ok: true, envelope: { version: 2, state: { count: 2 } } });

		const migrated = deserializePersistedState<{ count: number }>(JSON.stringify({ version: 1, state: { count: 1 } }), {
			version: 2,
			migrate(state, fromVersion) {
				return {
					count: (typeof state.count === 'number' ? state.count : 0) + fromVersion
				};
			}
		});
		expect(migrated).toEqual({ ok: true, envelope: { version: 2, state: { count: 2 } } });

		const invalidJson = deserializePersistedState<{ count: number }>('not-json', { version: 2 });
		expect(invalidJson).toEqual({ ok: false, error: expect.stringContaining('JSON') });

		const nullState = deserializePersistedState<{ count: number }>(JSON.stringify({ version: 2, state: null }), {
			version: 2
		});
		expect(nullState).toEqual({ ok: false, error: expect.stringMatching(/malformed/i) });

		const nestedPoisoned = deserializePersistedState<{ profile: { name: string } }>(
			JSON.stringify({
				version: 2,
				state: {
					profile: {
						name: 'safe',
						__proto__: { polluted: true }
					}
				}
			}),
			{ version: 2 }
		);

		expect(nestedPoisoned).toEqual({ ok: true, envelope: { version: 2, state: { profile: { name: 'safe' } } } });
		expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
	});

	it('sanitizes migrate input before passing to the migration callback', () => {
		// __proto__ as an own enumerable key (from JSON.parse) must be stripped
		// before the migrate callback receives the state, not only in the result.
		const seenKeys: string[] = [];

		const result = deserializePersistedState<{ name: string }>(
			JSON.stringify({ version: 1, state: { name: 'safe', __proto__: { injected: true } } }),
			{
				version: 2,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				migrate(state, fromVersion) {
					seenKeys.push(...Object.keys(state));
					return { name: state.name as string };
				}
			}
		);

		expect(result).toEqual({ ok: true, envelope: { version: 2, state: { name: 'safe' } } });
		expect(seenKeys).not.toContain('__proto__');
		expect(({} as { injected?: boolean }).injected).toBeUndefined();
	});
});
