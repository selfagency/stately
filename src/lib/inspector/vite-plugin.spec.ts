import { describe, expect, it } from 'vitest';
import { VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID, VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX } from './virtual.js';
import { createStatelyInspectorVitePlugin } from './vite-plugin.js';

describe('createStatelyInspectorVitePlugin', () => {
	it('resolves virtual modules and injects the inspector loader into Vite client code', async () => {
		const plugin = createStatelyInspectorVitePlugin();
		const resolveId = plugin.resolveId as (id: string) => Promise<string | undefined> | string | undefined;
		const load = plugin.load as (id: string) => Promise<string | undefined> | string | undefined;
		const transform = plugin.transform as (
			code: string,
			id: string,
			options?: { ssr?: boolean }
		) => Promise<{ code: string } | string | undefined> | { code: string } | string | undefined;

		expect(plugin.apply).toBe('serve');

		const optionsId = await resolveId(VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID);
		expect(optionsId).toBe(VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID);

		const runtimeId = await resolveId(`${VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX}load-inspector.ts`);
		expect(runtimeId).toContain('/src/lib/inspector/runtime/load-inspector.ts');

		const optionsModule = await load(VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID);
		expect(optionsModule).toContain('export default');

		const runtimeModule = await load(runtimeId as string);
		expect(runtimeModule).toContain('../bootstrap-client.js');

		const transformed = await transform(
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
		const enabledTransform = enabledPlugin.transform as (
			code: string,
			id: string,
			options?: { ssr?: boolean }
		) => Promise<unknown> | unknown;
		expect(
			await enabledTransform('export const client = true;', '/virtual/node_modules/vite/dist/client/client.mjs', {
				ssr: true
			})
		).toBeFalsy();

		const disabledPlugin = createStatelyInspectorVitePlugin({ enabled: false });
		const disabledTransform = disabledPlugin.transform as (
			code: string,
			id: string,
			options?: { ssr?: boolean }
		) => Promise<unknown> | unknown;
		expect(
			await disabledTransform('export const client = true;', '/virtual/node_modules/vite/dist/client/client.mjs', {
				ssr: false
			})
		).toBeFalsy();
	});
});
