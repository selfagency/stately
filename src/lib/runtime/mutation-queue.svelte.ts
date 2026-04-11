import type { StoreMutationContext } from '../pinia-like/store-types.js';

export interface MutationCommit<
	TType extends StoreMutationContext['type'] = StoreMutationContext['type']
> {
	id: number;
	storeId: string;
	type: TType;
	timestamp: number;
	mutationCount: number;
}

export function createMutationQueue(config: {
	storeId: string;
	notify: (
		type: StoreMutationContext['type'],
		payload: { commit: MutationCommit; payload?: unknown }
	) => void;
}) {
	let nextCommitId = 1;
	let activeCommit: MutationCommit<'patch-function'> | undefined;
	let depth = 0;

	const beginCommit = <TType extends StoreMutationContext['type']>(
		type: TType
	): MutationCommit<TType> => ({
		id: nextCommitId++,
		storeId: config.storeId,
		type,
		timestamp: Date.now(),
		mutationCount: 0
	});

	return {
		run<T>(type: StoreMutationContext['type'], payload: unknown, operation: () => T): T {
			if (type === 'patch-function') {
				const isOuter = !activeCommit;
				activeCommit ??= beginCommit('patch-function');
				depth += 1;
				try {
					return operation();
				} finally {
					depth -= 1;
					if (isOuter && depth === 0) {
						activeCommit.mutationCount ||= 1;
						config.notify('patch-function', { commit: activeCommit, payload });
						activeCommit = undefined;
					}
				}
			}

			const commit = beginCommit(type);
			try {
				return operation();
			} finally {
				commit.mutationCount ||= 1;
				config.notify(type, { commit, payload });
			}
		},
		recordChange(payload?: unknown): MutationCommit {
			if (activeCommit) {
				activeCommit.mutationCount += 1;
				return activeCommit;
			}

			const commit = beginCommit('direct');
			commit.mutationCount = 1;
			config.notify('direct', { commit, payload });
			return commit;
		}
	};
}
