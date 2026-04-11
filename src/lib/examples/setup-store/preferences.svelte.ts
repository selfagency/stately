import { defineStore } from '../../index.js';

export const usePreferencesStore = defineStore('example-setup-preferences', {
	setup: () => {
		let theme = $state<'light' | 'dark'>('light');
		let compact = $state(false);

		return {
			get theme() {
				return theme;
			},
			get compact() {
				return compact;
			},
			toggleTheme() {
				theme = theme === 'light' ? 'dark' : 'light';
			},
			setCompact(value: boolean) {
				compact = value;
			}
		};
	}
});
