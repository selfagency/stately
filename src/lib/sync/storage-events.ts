import type { SyncMessage, SyncTransport } from './types.js';

interface StorageEventLike {
	key: string | null;
	newValue: string | null;
}

interface WindowLike {
	addEventListener(type: 'storage', listener: (event: StorageEventLike) => void): void;
	removeEventListener(type: 'storage', listener: (event: StorageEventLike) => void): void;
}

interface StorageLike {
	setItem(key: string, value: string): void;
}

export function createStorageEventTransport<Message extends { origin?: string } = SyncMessage>(
	key: string,
	options: {
		origin: string;
		window?: WindowLike;
		storage?: StorageLike;
	}
): SyncTransport<Message> {
	const win = options.window;
	const storage = options.storage;
	const listeners = new Set<(message: Message) => void>();

	const handleStorage = (event: StorageEventLike) => {
		if (event.key !== key || !event.newValue) {
			return;
		}

		let message: Message;
		try {
			message = JSON.parse(event.newValue) as Message;
		} catch {
			return;
		}

		if (message?.origin === options.origin) {
			return;
		}

		for (const listener of listeners) {
			try {
				listener(message);
			} catch {
				// Listener error should not break other listeners
			}
		}
	};

	win?.addEventListener('storage', handleStorage);

	return {
		publish(message) {
			storage?.setItem(key, JSON.stringify(message));
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		destroy() {
			listeners.clear();
			win?.removeEventListener('storage', handleStorage);
		}
	};
}
