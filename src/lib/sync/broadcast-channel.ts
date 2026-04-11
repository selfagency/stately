import type { SyncMessage, SyncTransport } from './types.js';

interface BroadcastChannelLike<Message> {
	postMessage(message: Message): void;
	close(): void;
	addEventListener(type: 'message', listener: (event: { data: Message }) => void): void;
	removeEventListener(type: 'message', listener: (event: { data: Message }) => void): void;
}

interface BroadcastChannelConstructor<Message> {
	new (name: string): BroadcastChannelLike<Message>;
}

export function createBroadcastChannelTransport<Message extends { origin?: string } = SyncMessage>(
	name: string,
	options: {
		origin: string;
		BroadcastChannel?: BroadcastChannelConstructor<Message>;
	}
): SyncTransport<Message> {
	const BroadcastChannel =
		options.BroadcastChannel ?? (globalThis.BroadcastChannel as BroadcastChannelConstructor<Message> | undefined);
	const channel = BroadcastChannel ? new BroadcastChannel(name) : undefined;
	const listeners = new Set<(message: Message) => void>();

	function handleMessage(event: { data: Message }): void {
		if (event.data?.origin === options.origin) {
			return;
		}

		for (const listener of listeners) {
			try {
				listener(event.data);
			} catch {
				// Listener error should not break other listeners
			}
		}
	}

	if (channel) {
		channel.addEventListener('message', handleMessage);
	}

	return {
		publish(message) {
			try {
				channel?.postMessage(message);
			} catch {
				// Non-serializable message or closed channel
			}
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		destroy() {
			listeners.clear();
			if (channel) {
				channel.removeEventListener('message', handleMessage);
				channel.close();
			}
		}
	};
}
