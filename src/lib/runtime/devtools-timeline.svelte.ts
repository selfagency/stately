export interface DevtoolsTimelineEntry {
	id: number;
	storeId: string;
	kind: 'mutation' | 'action';
	label: string;
	startedAt: number;
	endedAt: number;
	duration: number;
	payload?: unknown;
	snapshot?: unknown;
	result?: unknown;
	status: 'completed' | 'errored';
}

export function createDevtoolsTimelineRecorder(config: {
	storeId: string;
	readSnapshot: () => unknown;
}) {
	const entries = $state([] as DevtoolsTimelineEntry[]);
	let nextId = 1;

	return {
		recordMutation(input: { label: string; payload?: unknown }) {
			const timestamp = Date.now();
			entries.push({
				id: nextId++,
				storeId: config.storeId,
				kind: 'mutation',
				label: input.label,
				startedAt: timestamp,
				endedAt: timestamp,
				duration: 0,
				payload: input.payload,
				snapshot: config.readSnapshot(),
				status: 'completed'
			});
		},
		startAction(input: { label: string; payload?: unknown }) {
			const id = nextId++;
			const startedAt = Date.now();
			return {
				finish(result?: unknown) {
					const endedAt = Date.now();
					entries.push({
						id,
						storeId: config.storeId,
						kind: 'action',
						label: input.label,
						startedAt,
						endedAt,
						duration: endedAt - startedAt,
						payload: input.payload,
						snapshot: config.readSnapshot(),
						result,
						status: 'completed'
					});
				},
				fail(error: unknown) {
					const endedAt = Date.now();
					entries.push({
						id,
						storeId: config.storeId,
						kind: 'action',
						label: input.label,
						startedAt,
						endedAt,
						duration: endedAt - startedAt,
						payload: input.payload,
						snapshot: config.readSnapshot(),
						result: error,
						status: 'errored'
					});
				}
			};
		},
		read() {
			return [...entries];
		}
	};
}
