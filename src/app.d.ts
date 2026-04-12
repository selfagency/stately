// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'virtual:stately-inspector-options' {
	const options: {
		enabled: boolean;
		buttonPosition: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
		panelSide: 'left' | 'right';
	};

	export default options;
}

export {};
