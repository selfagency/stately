import { describe, expect, it, vi } from 'vitest';
import { createConcurrencyController } from './concurrency.js';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});
	return { promise, resolve };
}

describe('createConcurrencyController', () => {
	it('supports parallel, restartable, drop, enqueue, and dedupe modes', async () => {
		const calls: string[] = [];
		const cancelActive = vi.fn();
		const parallel = createConcurrencyController('parallel', async (value: string) => {
			calls.push(`parallel:${value}`);
			return value;
		});
		await expect(Promise.all([parallel.run('a'), parallel.run('b')])).resolves.toEqual(['a', 'b']);

		const firstRestartable = deferred<string>();
		const restartable = createConcurrencyController(
			'restartable',
			(value: string) => {
				calls.push(`restartable:${value}`);
				return value === 'a' ? firstRestartable.promise : Promise.resolve(value);
			},
			{ cancelActive }
		);
		const pendingRestartable = restartable.run('a');
		const nextRestartable = restartable.run('b');
		firstRestartable.resolve('a');
		await expect(nextRestartable).resolves.toBe('b');
		await expect(pendingRestartable).resolves.toBe('a');
		expect(cancelActive).toHaveBeenCalledTimes(1);

		const firstDrop = deferred<string>();
		const drop = createConcurrencyController('drop', (value: string) => {
			calls.push(`drop:${value}`);
			return value === 'a' ? firstDrop.promise : Promise.resolve(value);
		});
		const droppedFirst = drop.run('a');
		const droppedSecond = drop.run('b');
		firstDrop.resolve('a');
		await expect(droppedFirst).resolves.toBe('a');
		await expect(droppedSecond).resolves.toBeUndefined();

		const enqueue = createConcurrencyController('enqueue', async (value: string) => {
			calls.push(`enqueue:${value}`);
			return value;
		});
		await expect(Promise.all([enqueue.run('a'), enqueue.run('b')])).resolves.toEqual(['a', 'b']);

		const dedupeFirst = deferred<string>();
		const dedupe = createConcurrencyController(
			'dedupe',
			(value: string) => {
				calls.push(`dedupe:${value}`);
				return value === 'a' ? dedupeFirst.promise : Promise.resolve(value);
			},
			{ key: (value) => value }
		);
		const dedupePending = dedupe.run('a');
		const dedupePendingAgain = dedupe.run('a');
		const dedupeDifferent = dedupe.run('b');
		dedupeFirst.resolve('a');
		await expect(dedupePending).resolves.toBe('a');
		await expect(dedupePendingAgain).resolves.toBe('a');
		await expect(dedupeDifferent).resolves.toBe('b');

		expect(calls).toEqual([
			'parallel:a',
			'parallel:b',
			'restartable:a',
			'restartable:b',
			'drop:a',
			'enqueue:a',
			'enqueue:b',
			'dedupe:a',
			'dedupe:b'
		]);
	});
});
