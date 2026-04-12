import { describe, expect, it, vi } from 'vitest';
import { debounceAction, throttleAction } from './action-helpers.js';

describe('debounceAction', () => {
	it('delays execution until the debounce period elapses', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const debounced = debounceAction(spy, 100);

		debounced('a');
		debounced('b');
		debounced('c');
		expect(spy).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith('c');
		vi.useRealTimers();
	});

	it('exposes cancel() to abort a pending invocation', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const debounced = debounceAction(spy, 50);

		debounced();
		debounced.cancel();
		vi.advanceTimersByTime(100);
		expect(spy).not.toHaveBeenCalled();
		vi.useRealTimers();
	});
});

describe('throttleAction', () => {
	it('invokes immediately then suppresses until the interval passes', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = throttleAction(spy, 100);

		throttled('a');
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith('a');

		throttled('b');
		throttled('c');
		expect(spy).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(100);
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy).toHaveBeenLastCalledWith('c');
		vi.useRealTimers();
	});

	it('exposes cancel() to clear the trailing call', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = throttleAction(spy, 100);

		throttled('a');
		throttled('b');
		throttled.cancel();
		vi.advanceTimersByTime(200);
		expect(spy).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});
});
