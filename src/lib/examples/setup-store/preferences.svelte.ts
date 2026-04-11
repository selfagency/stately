import { defineStore } from '../../index.js';

export const usePreferencesStore = defineStore('example-setup-preferences', {
	setup: () => ({
		theme: 'light' as 'light' | 'dark',
		compact: false,
		toggleTheme() {
			this.theme = this.theme === 'light' ? 'dark' : 'light';
		},
		setCompact(value: boolean) {
			this.compact = value;
		}
	})
});
