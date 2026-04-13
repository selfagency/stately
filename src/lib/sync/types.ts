export interface SyncMessage<State extends object = object> {
	version: number;
	storeId: string;
	origin: string;
	mutationId: number;
	timestamp: number;
	state: State;
}

export type SyncMessageState<Message extends SyncMessage = SyncMessage> =
	Message extends SyncMessage<infer State> ? State : object;

export interface SyncTransport<Message = SyncMessage> {
	publish(message: Message): void;
	subscribe(listener: (message: Message) => void): () => void;
	destroy(): void;
}
