import './style.css';
import { mount, unmount } from 'svelte';
import InspectorDrawer from './InspectorDrawer.svelte';
import {
	createStatelyInspectorHook,
	getStatelyInspectorHook,
	installStatelyInspectorHook,
	resetStatelyInspectorHook
} from './hook.js';
import type { StatelyInspectorButtonPosition, StatelyInspectorPanelSide } from './types.js';

const statelyInspectorHostId = 'stately-inspector-host';

let app: ReturnType<typeof mount> | undefined;

function ensureHook() {
	return getStatelyInspectorHook() ?? installStatelyInspectorHook(createStatelyInspectorHook());
}

function ensureHost(): HTMLElement {
	const existing = document.getElementById(statelyInspectorHostId);
	if (existing) {
		return existing;
	}

	const host = document.createElement('div');
	host.id = statelyInspectorHostId;
	document.body.append(host);
	return host;
}

export function mountStatelyInspector(options?: {
	initiallyOpen?: boolean;
	buttonPosition?: StatelyInspectorButtonPosition;
	panelSide?: StatelyInspectorPanelSide;
}): void {
	if (app) {
		return;
	}

	app = mount(InspectorDrawer, {
		target: ensureHost(),
		props: {
			hook: ensureHook(),
			initiallyOpen: options?.initiallyOpen ?? false,
			buttonPosition: options?.buttonPosition,
			panelSide: options?.panelSide
		}
	});
}

export function disposeStatelyInspector(options?: { resetHook?: boolean }): void {
	if (app) {
		unmount(app);
		app = undefined;
	}

	document.getElementById(statelyInspectorHostId)?.remove();

	if (options?.resetHook) {
		resetStatelyInspectorHook();
	}
}
