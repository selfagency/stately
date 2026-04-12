export interface SyncMessage<State = Record<string, unknown>> {
	version: number;
	storeId: string;
	origin: string;
	mutationId: number;
	timestamp: number;
	state: State;
}

export interface SyncTransport<Message = SyncMessage> {
	publish(message: Message): void;
	subscribe(listener: (message: Message) => void): () => void;
	destroy(): void;
}
