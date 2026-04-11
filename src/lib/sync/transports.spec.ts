import { describe, expect, it } from 'vitest';
import { createBroadcastChannelTransport } from './broadcast-channel.js';
import { createStorageEventTransport } from './storage-events.js';

class FakeBroadcastChannel {
	static instances: FakeBroadcastChannel[] = [];
	name: string;
	private listeners = new Map<string, Set<(event: { data: unknown }) => void>>();
	messages: unknown[] = [];
	closed = false;

	constructor(name: string) {
		this.name = name;
		FakeBroadcastChannel.instances.push(this);
	}

	addEventListener(type: string, listener: (event: { data: unknown }) => void) {
		if (!this.listeners.has(type)) this.listeners.set(type, new Set());
		this.listeners.get(type)!.add(listener);
	}

	removeEventListener(type: string, listener: (event: { data: unknown }) => void) {
		this.listeners.get(type)?.delete(listener);
	}

	dispatchMessage(data: unknown) {
		for (const listener of this.listeners.get('message') ?? []) {
			listener({ data });
		}
	}

	postMessage(message: unknown) {
		this.messages.push(message);
	}

	close() {
		this.closed = true;
	}
}

describe('sync transports', () => {
	it('filters self-originated broadcast channel messages', () => {
		const transport = createBroadcastChannelTransport<{ origin: string; state: { count: number } }>('stately-sync', {
			origin: 'local-origin',
			BroadcastChannel: FakeBroadcastChannel as never
		});
		const received: unknown[] = [];
		transport.subscribe((message) => received.push(message));
		const channel = FakeBroadcastChannel.instances.at(-1)!;

		transport.publish({ origin: 'local-origin', state: { count: 1 } });
		channel.dispatchMessage({ origin: 'local-origin', state: { count: 2 } });
		channel.dispatchMessage({ origin: 'remote-origin', state: { count: 3 } });

		expect(channel.messages).toEqual([{ origin: 'local-origin', state: { count: 1 } }]);
		expect(received).toEqual([{ origin: 'remote-origin', state: { count: 3 } }]);
	});

	it('filters self-originated storage events and writes serialized payloads', () => {
		const listeners = new Set<(event: StorageEventLike) => void>();
		const storage = new Map<string, string>();
		const transport = createStorageEventTransport<{ origin: string; state: { count: number } }>('stately-sync', {
			origin: 'local-origin',
			window: {
				addEventListener(_type: string, listener: (event: StorageEventLike) => void) {
					listeners.add(listener);
				},
				removeEventListener(_type: string, listener: (event: StorageEventLike) => void) {
					listeners.delete(listener);
				}
			},
			storage: {
				setItem(key: string, value: string) {
					storage.set(key, value);
				}
			}
		});
		const received: unknown[] = [];
		transport.subscribe((message) => received.push(message));

		transport.publish({ origin: 'local-origin', state: { count: 1 } });
		for (const listener of listeners) {
			listener({
				key: 'stately-sync',
				newValue: JSON.stringify({ origin: 'local-origin', state: { count: 2 } })
			});
			listener({
				key: 'stately-sync',
				newValue: JSON.stringify({ origin: 'remote-origin', state: { count: 3 } })
			});
		}

		expect(storage.get('stately-sync')).toBe(JSON.stringify({ origin: 'local-origin', state: { count: 1 } }));
		expect(received).toEqual([{ origin: 'remote-origin', state: { count: 3 } }]);
	});
});

interface StorageEventLike {
	key: string | null;
	newValue: string | null;
}
