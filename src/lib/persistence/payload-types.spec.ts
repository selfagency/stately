import { describe, expect, expectTypeOf, it } from 'vitest';
import type { JsonObject, JsonValue, PersistEnvelope } from './types.js';
import type { SyncMessage } from '../sync/types.js';

describe('payload types', () => {
  it('exposes JSON-safe persistence and sync payload helper types', () => {
    type PersistedState = PersistEnvelope<JsonObject>['state'];
    type SyncedState = SyncMessage<JsonObject>['state'];

    expectTypeOf<PersistedState>().toEqualTypeOf<JsonObject>();
    expectTypeOf<SyncedState>().toEqualTypeOf<JsonObject>();
    expectTypeOf<JsonObject['example']>().toEqualTypeOf<JsonValue>();
    expect(true).toBe(true);
  });
});
