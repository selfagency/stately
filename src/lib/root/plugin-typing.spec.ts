import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineStore } from '../define-store.svelte.js';
import type { StoreCustomProperties, StoreState } from '../pinia-like/store-types.js';
import { createStateManager } from './create-state-manager.js';
import { defineStateManagerPlugin, type StoreDefinition } from './types.js';

declare module '../pinia-like/store-types.js' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface StoreCustomProperties<State extends StoreState = StoreState, Store extends object = object> {
		$pluginMeta: {
			source: 'typed-plugin';
		};
		$pluginCount: number;
	}
}

describe('plugin typing', () => {
	it('validates declared augmentation shapes and applies multiple plugin augmentations', () => {
		const metaPlugin = defineStateManagerPlugin<
			StoreDefinition,
			{ count: number },
			Pick<StoreCustomProperties, '$pluginMeta'>
		>(({ store }) => {
			expectTypeOf(store.count).toEqualTypeOf<number>();
			return {
				$pluginMeta: {
					source: 'typed-plugin'
				}
			};
		});

		const countPlugin = defineStateManagerPlugin<
			StoreDefinition,
			{ count: number },
			Pick<StoreCustomProperties, '$pluginCount'>
		>(({ store }) => ({
			get $pluginCount() {
				return store.count;
			}
		}));

		defineStateManagerPlugin<StoreDefinition, { count: number }, Pick<StoreCustomProperties, '$pluginCount'>>(() => ({
			// @ts-expect-error plugin augmentation must match the declared property type
			$pluginCount: 'nope'
		}));

		const manager = createStateManager().use(metaPlugin).use(countPlugin);
		const useCounterStore = defineStore('typed-plugin-store', {
			setup: () => ({
				count: 1,
				increment() {
					this.count += 1;
				}
			})
		});

		const store = useCounterStore(manager);
		expectTypeOf(store.$pluginMeta.source).toEqualTypeOf<'typed-plugin'>();
		expectTypeOf(store.$pluginCount).toEqualTypeOf<number>();

		expect(store.$pluginMeta.source).toBe('typed-plugin');
		expect(store.$pluginCount).toBe(1);
		store.increment();
		expect(store.$pluginCount).toBe(2);
	});
});
