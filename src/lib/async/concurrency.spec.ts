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

  it('dedupe cleans up activeByKey after settlement and handles non-serializable args safely', async () => {
    const calls: string[] = [];
    const first = deferred<string>();
    const second = deferred<string>();
    const dedupe = createConcurrencyController(
      'dedupe',
      (value: string) => {
        calls.push(value);
        if (value === 'a') return first.promise;
        if (value === 'b') return second.promise;
        return Promise.resolve(value);
      },
      { key: (value) => value }
    );

    const p1 = dedupe.run('a');
    const p1Again = dedupe.run('a');
    expect(calls).toEqual(['a']);

    first.resolve('done-a');
    await expect(p1).resolves.toBe('done-a');
    await expect(p1Again).resolves.toBe('done-a');

    // After settlement the key should be cleared, so a new call starts fresh
    const p2 = dedupe.run('a');
    second.resolve('done-b');
    const p3 = dedupe.run('b');
    await expect(p2).resolves.toBe('done-a');
    await expect(p3).resolves.toBe('done-b');
    expect(calls).toEqual(['a', 'a', 'b']);

    // Non-serializable args (BigInt) should not throw; they produce unique keys
    const nonSerializable = createConcurrencyController('dedupe', async (n: bigint) => String(n));
    await expect(nonSerializable.run(BigInt(1))).resolves.toBe('1');
  });
});
