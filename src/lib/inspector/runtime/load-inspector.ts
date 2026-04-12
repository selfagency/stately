import options from 'virtual:stately-inspector-options';
import { disposeStatelyInspector, mountStatelyInspector } from '../bootstrap-client.js';

if (typeof document !== 'undefined') {
	mountStatelyInspector(options);
}

if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(() => {
		disposeStatelyInspector();
	});
}

export {};
