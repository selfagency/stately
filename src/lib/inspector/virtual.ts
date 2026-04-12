export const VIRTUAL_STATELY_INSPECTOR_OPTIONS_ID = 'virtual:stately-inspector-options';
export const VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX = 'virtual:stately-inspector-path:';
export const VIRTUAL_STATELY_INSPECTOR_LOADER_ID = `${VIRTUAL_STATELY_INSPECTOR_PATH_PREFIX}load-inspector.ts`;

export function cleanInspectorUrl(url: string): string {
	return url.replace(/[?#].*$/su, '');
}
