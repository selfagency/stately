import type { SyncMessage, SyncTransport } from './types.js';

interface BroadcastChannelLike<Message> {
	postMessage(message: Message): void;
	close(): void;
	onmessage: ((event: { data: Message }) => void) | null;
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
		options.BroadcastChannel ??
		(globalThis.BroadcastChannel as BroadcastChannelConstructor<Message> | undefined);
	const channel = BroadcastChannel ? new BroadcastChannel(name) : undefined;
	const listeners = new Set<(message: Message) => void>();

	if (channel) {
		channel.onmessage = (event) => {
			if (event.data?.origin === options.origin) {
				return;
			}

			for (const listener of listeners) {
				listener(event.data);
			}
		};
	}

	return {
		publish(message) {
			channel?.postMessage(message);
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
				channel.onmessage = null;
				channel.close();
			}
		}
	};
}
