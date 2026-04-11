import { describe, expect, it } from 'vitest';
import * as stately from './index.js';

describe('public entrypoint', () => {
	it('exports the stable core API without leaking internal reset helpers', () => {
		expect(stately).toMatchObject({
			createStateManager: expect.any(Function),
			getDefaultStateManager: expect.any(Function),
			initializeStateManagerContext: expect.any(Function),
			getStateManager: expect.any(Function),
			setStateManager: expect.any(Function),
			defineStore: expect.any(Function),
			storeToRefs: expect.any(Function)
		});

		expect(stately).not.toHaveProperty('resetDefaultStateManager');
	});
});
