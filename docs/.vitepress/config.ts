import { defineConfig } from 'vitepress';

const title = 'Stately';
const description =
	'Pinia-inspired state management for Svelte 5 and SvelteKit with persistence, history, sync, and async orchestration.';

export default defineConfig({
	title,
	description,
	lang: 'en-US',
	base: '/stately/',
	cleanUrls: true,
	lastUpdated: true,
	head: [['meta', { name: 'theme-color', content: '#2563eb' }]],
	themeConfig: {
		nav: [
			{ text: 'Guide', link: '/guide/' },
			{ text: 'Reference', link: '/reference/api' },
			{ text: 'GitHub', link: 'https://github.com/selfagency/stately' }
		],
		sidebar: {
			'/guide/': [
				{
					text: 'Getting started',
					items: [
						{ text: 'Overview', link: '/guide/' },
						{ text: 'Define stores', link: '/guide/define-store' },
						{ text: 'SSR and SvelteKit', link: '/guide/ssr-and-sveltekit' },
						{ text: 'Plugins', link: '/guide/plugins' },
						{ text: 'Examples', link: '/guide/examples' }
					]
				},
				{
					text: 'Operations',
					items: [
						{ text: 'Testing and releases', link: '/guide/testing-and-releases' },
						{ text: 'Migration from Pinia', link: '/guide/migration-from-pinia' },
						{ text: 'Troubleshooting', link: '/guide/troubleshooting' }
					]
				}
			],
			'/reference/': [
				{
					text: 'Reference',
					items: [{ text: 'Public API', link: '/reference/api' }]
				}
			]
		},
		socialLinks: [{ icon: 'github', link: 'https://github.com/selfagency/stately' }],
		footer: {
			message: 'Released under the MIT License.',
			copyright: 'Copyright © 2026 Self Agency'
		},
		editLink: {
			pattern: 'https://github.com/selfagency/stately/edit/main/docs/:path',
			text: 'Edit this page on GitHub'
		},
		search: {
			provider: 'local'
		},
		outline: {
			level: [2, 3],
			label: 'On this page'
		}
	}
});
