import { describe, expect, it } from 'vitest';
import { VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID, VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX } from './virtual.js';
import { createStatelyInspectorVitePlugin } from './vite-plugin.js';

describe('createStatelyInspectorVitePlugin', () => {
	it('resolves virtual modules and injects the inspector loader into Vite client code', async () => {
		const plugin = createStatelyInspectorVitePlugin();

		expect(plugin.apply).toBe('serve');

		const optionsId = await plugin.resolveId?.(VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID);
		expect(optionsId).toBe(VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID);

		const runtimeId = await plugin.resolveId?.(`${VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX}load-inspector.ts`);
		expect(runtimeId).toContain('/src/lib/inspector/runtime/load-inspector.ts');

		const optionsModule = await plugin.load?.(VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID);
		expect(optionsModule).toContain('export default');

		const runtimeModule = await plugin.load?.(runtimeId as string);
		expect(runtimeModule).toContain('../bootstrap-client.js');

		const transformed = await plugin.transform?.(
			'export const client = true;',
			'/virtual/node_modules/vite/dist/client/client.mjs',
			{ ssr: false }
		);
		expect(typeof transformed === 'string' ? transformed : transformed?.code).toContain(
			"import('virtual:stately-inspector-path:load-inspector.ts')"
		);
	});

	it('stays inert for SSR transforms and disabled mode', async () => {
		const enabledPlugin = createStatelyInspectorVitePlugin();
		expect(
			await enabledPlugin.transform?.(
				'export const client = true;',
				'/virtual/node_modules/vite/dist/client/client.mjs',
				{
					ssr: true
				}
			)
		).toBeFalsy();

		const disabledPlugin = createStatelyInspectorVitePlugin({ enabled: false });
		expect(
			await disabledPlugin.transform?.(
				'export const client = true;',
				'/virtual/node_modules/vite/dist/client/client.mjs',
				{ ssr: false }
			)
		).toBeFalsy();
	});
});
