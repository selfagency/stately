import { disposeStatelyInspector, mountStatelyInspector } from '../bootstrap-client.js';

if (typeof document !== 'undefined') {
	mountStatelyInspector();
}

if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(() => {
		disposeStatelyInspector();
	});
}

export {};
