import { describe, expect, expectTypeOf, it } from 'vitest';
import { VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID, VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX } from './virtual.js';
import type { StatelyInspectorVitePluginOptions } from './vite-plugin.js';
import { statelyVitePlugin } from './vite-plugin.js';

type VirtualInspectorOptions = (typeof import('virtual:stately-inspector-options'))['default'];

describe('statelyVitePlugin', () => {
  it('exposes typed virtual options and plugin options', () => {
    expectTypeOf<StatelyInspectorVitePluginOptions>().toMatchTypeOf<{
      enabled?: boolean;
      buttonPosition?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
      panelSide?: 'left' | 'right';
    }>();
    expectTypeOf<VirtualInspectorOptions['buttonPosition']>().toEqualTypeOf<
      'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'
    >();
    expectTypeOf<VirtualInspectorOptions['panelSide']>().toEqualTypeOf<'left' | 'right'>();
    expectTypeOf<VirtualInspectorOptions['enabled']>().toEqualTypeOf<boolean>();
    expect(true).toBe(true);
  });

  it('resolves virtual modules and injects the inspector loader into Vite client code', async () => {
    const plugin = statelyVitePlugin();
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
    expect(optionsModule).toContain('right-bottom');
    expect(optionsModule).toContain('right');

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

  it('injects the inspector loader for normalized pnpm Vite client ids with query strings', async () => {
    const plugin = statelyVitePlugin();
    const transform = plugin.transform as (
      code: string,
      id: string,
      options?: { ssr?: boolean }
    ) => Promise<{ code: string } | string | undefined> | { code: string } | string | undefined;

    const transformed = await transform(
      'export const client = true;',
      '/virtual/node_modules/.pnpm/vite@7.1.7/node_modules/vite/dist/client/client.mjs?v=abcdef',
      { ssr: false }
    );

    expect(typeof transformed === 'string' ? transformed : transformed?.code).toContain(
      "import('virtual:stately-inspector-path:load-inspector.ts')"
    );
  });

  it('stays inert for SSR transforms and disabled mode', async () => {
    const enabledPlugin = statelyVitePlugin();
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

    const disabledPlugin = statelyVitePlugin({ enabled: false });
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

  it('serializes custom button and panel positions into the virtual options module', async () => {
    const plugin = statelyVitePlugin({ buttonPosition: 'left-top', panelSide: 'left' });
    const load = plugin.load as (id: string) => Promise<string | undefined> | string | undefined;

    const optionsModule = await load(VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID);
    expect(optionsModule).toContain('left-top');
    expect(optionsModule).toContain('left');
  });
});
