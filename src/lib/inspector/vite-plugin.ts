import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, type Plugin } from 'vite';
import {
	cleanInspectorUrl,
	VIRTUAL_STATELY_INSPECTOR_LOADER_ID,
	VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID,
	VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX
} from './virtual.js';

export interface StatelyInspectorVitePluginOptions {
	enabled?: boolean;
	buttonPosition?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
	panelSide?: 'left' | 'right';
}

function getInspectorRuntimePath(): string {
	return normalizePath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'runtime'));
}

function isViteClientModule(id: string): boolean {
	const normalizedId = normalizePath(cleanInspectorUrl(id));
	return normalizedId.endsWith('/vite/dist/client/client.mjs');
}

export function statelyVitePlugin(options: StatelyInspectorVitePluginOptions = {}): Plugin {
	const runtimePath = getInspectorRuntimePath();
	const enabled = options.enabled ?? true;
	const buttonPosition = options.buttonPosition ?? 'right-bottom';
	const panelSide = options.panelSide ?? 'right';

	return {
		name: 'vite-plugin-stately-inspector',
		apply: 'serve',
		enforce: 'pre',
		resolveId(id) {
			if (!enabled) {
				return;
			}

			if (id === VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID) {
				return id;
			}

			if (id.startsWith(VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX)) {
				return id.replace(VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX, `${runtimePath}/`);
			}
		},
		load(id) {
			if (!enabled) {
				return;
			}

			if (id === VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID) {
				return `export default ${JSON.stringify({ enabled, buttonPosition, panelSide })}`;
			}

			if (id.startsWith(runtimePath)) {
				const file = normalizePath(cleanInspectorUrl(id));
				if (file.startsWith(runtimePath) && fs.existsSync(file)) {
					return fs.readFileSync(file, 'utf8');
				}
			}
		},
		transform(code, id, transformOptions) {
			if (!enabled || transformOptions?.ssr || !isViteClientModule(id)) {
				return;
			}

			return {
				code: `${code}\n;import('${VIRTUAL_STATELY_INSPECTOR_LOADER_ID}')`,
				map: null
			};
		}
	};
}
