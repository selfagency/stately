import { describe, expect, it } from 'vitest';
import { defineStore } from './define-store.svelte.js';
import { createFsmPlugin } from './fsm/plugin.svelte.js';
import { createHistoryPlugin } from './history/plugin.svelte.js';
import { createStateManager } from './root/create-state-manager.js';

describe('FSM plugin', () => {
	it('adds $fsm controller with initial state', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-basic', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: { START: 'loading' },
					loading: { RESOLVE: 'success', REJECT: 'error' },
					success: { RESET: 'idle' },
					error: { RETRY: 'loading', RESET: 'idle' }
				}
			}
		});
		const store = useStore(manager);

		expect(store.$fsm).toBeDefined();
		expect(store.$fsm.current).toBe('idle');
	});

	it('transitions state on send()', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-transition', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: { START: 'loading' },
					loading: { RESOLVE: 'success', REJECT: 'error' },
					success: { RESET: 'idle' },
					error: { RETRY: 'loading', RESET: 'idle' }
				}
			}
		});
		const store = useStore(manager);

		const result = store.$fsm.send('START');
		expect(result).toBe('loading');
		expect(store.$fsm.current).toBe('loading');

		store.$fsm.send('RESOLVE');
		expect(store.$fsm.current).toBe('success');
	});

	it('ignores events not defined for current state', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-ignore', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: { START: 'loading' },
					loading: { RESOLVE: 'success' },
					success: {}
				}
			}
		});
		const store = useStore(manager);

		const result = store.$fsm.send('RESOLVE');
		expect(result).toBe('idle');
		expect(store.$fsm.current).toBe('idle');
	});

	it('matches() checks current state', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-matches', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: { START: 'loading' },
					loading: { RESOLVE: 'success' },
					success: {}
				}
			}
		});
		const store = useStore(manager);

		expect(store.$fsm.matches('idle')).toBe(true);
		expect(store.$fsm.matches('loading')).toBe(false);
		expect(store.$fsm.matches('idle', 'loading')).toBe(true);
	});

	it('can() checks if event is valid for current state', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-can', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: { START: 'loading' },
					loading: { RESOLVE: 'success' },
					success: {}
				}
			}
		});
		const store = useStore(manager);

		expect(store.$fsm.can('START')).toBe(true);
		expect(store.$fsm.can('RESOLVE')).toBe(false);

		store.$fsm.send('START');
		expect(store.$fsm.can('RESOLVE')).toBe(true);
		expect(store.$fsm.can('START')).toBe(false);
	});

	it('calls _enter and _exit hooks during transitions', () => {
		const entered: string[] = [];
		const exited: string[] = [];

		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-hooks', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: {
						START: 'loading',
						_exit(ctx) {
							exited.push(`idle→${ctx.to}`);
						}
					},
					loading: {
						RESOLVE: 'success',
						_enter(ctx) {
							entered.push(`${ctx.from}→loading`);
						},
						_exit(ctx) {
							exited.push(`loading→${ctx.to}`);
						}
					},
					success: {
						_enter(ctx) {
							entered.push(`${ctx.from}→success`);
						}
					}
				}
			}
		});
		const store = useStore(manager);

		store.$fsm.send('START');
		expect(exited).toEqual(['idle→loading']);
		expect(entered).toEqual(['idle→loading']);

		store.$fsm.send('RESOLVE');
		expect(exited).toEqual(['idle→loading', 'loading→success']);
		expect(entered).toEqual(['idle→loading', 'loading→success']);
	});

	it('supports computed transitions via functions', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-computed', {
			state: () => ({ retries: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: { START: 'loading' },
					loading: { RESOLVE: 'success', REJECT: 'error' },
					success: {},
					error: {
						RETRY(...args: unknown[]) {
							const retries = args[0] as number;
							return retries < 3 ? 'loading' : undefined;
						}
					}
				}
			}
		});
		const store = useStore(manager);

		store.$fsm.send('START');
		store.$fsm.send('REJECT');
		expect(store.$fsm.current).toBe('error');

		store.$fsm.send('RETRY', 1);
		expect(store.$fsm.current).toBe('loading');

		store.$fsm.send('REJECT');
		store.$fsm.send('RETRY', 5);
		expect(store.$fsm.current).toBe('error');
	});

	it('does not add $fsm to stores without fsm option', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('no-fsm', {
			state: () => ({ count: 0 })
		});
		const store = useStore(manager);

		expect('$fsm' in store).toBe(false);
	});

	it('records FSM transitions in history when both plugins active', () => {
		const manager = createStateManager().use(createFsmPlugin()).use(createHistoryPlugin());
		const useStore = defineStore('fsm-history', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: { START: 'loading' },
					loading: { RESOLVE: 'success' },
					success: { RESET: 'idle' }
				}
			},
			history: { limit: 10 }
		});
		const store = useStore(manager);

		store.$fsm.send('START');
		store.$fsm.send('RESOLVE');

		expect(store.$history.entries).toHaveLength(3);
		store.$history.undo();
		expect(store.$fsm.current).toBe('loading');
	});

	it('throws on invalid FSM definition: missing initial state in states', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-invalid', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'nonexistent',
				states: {
					idle: { START: 'loading' },
					loading: {}
				}
			}
		});

		expect(() => useStore(manager)).toThrow();
	});

	it('rolls back current state when _enter hook throws', () => {
		const manager = createStateManager().use(createFsmPlugin());
		const useStore = defineStore('fsm-enter-rollback', {
			state: () => ({ count: 0 }),
			fsm: {
				initial: 'idle',
				states: {
					idle: { START: 'loading' },
					loading: {
						_enter() {
							throw new Error('enter failed');
						}
					}
				}
			}
		});
		const store = useStore(manager);

		expect(() => store.$fsm.send('START')).toThrow('enter failed');

		// State must be rolled back to 'idle', not stuck at 'loading'.
		expect(store.$fsm.current).toBe('idle');
	});
});
