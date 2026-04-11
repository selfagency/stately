import { describe, expect, it } from 'vitest';
import { createRequestController } from './request-controller.js';

describe('createRequestController', () => {
	it('creates abortable request tokens and tracks the latest active request', () => {
		const controller = createRequestController();
		const first = controller.begin();
		const second = controller.begin({ abortActive: true });

		expect(first.token).toBe(1);
		expect(second.token).toBe(2);
		expect(first.signal.aborted).toBe(true);
		expect(controller.isCurrent(1)).toBe(false);
		expect(controller.isCurrent(2)).toBe(true);

		controller.clear(2);
		expect(controller.isCurrent(2)).toBe(false);
	});
});
