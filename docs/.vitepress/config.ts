import { defineConfig } from 'vitepress';

const title = 'Stately';
const description =
	'Pinia-inspired state management for Svelte 5 and SvelteKit with persistence, history, sync, and async orchestration.';

export default defineConfig({
	title,
	description,
	lang: 'en-US',
	base: '/',
	cleanUrls: true,
	lastUpdated: true,
	head: [
		['meta', { name: 'theme-color', content: '#2563eb' }],
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/stately.svg' }],
		['link', { rel: 'apple-touch-icon', href: '/stately.svg' }]
	],
	themeConfig: {
		logo: '/stately.svg',
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
						{ text: 'Examples and recipes', link: '/guide/examples' }
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
					items: [
						{ text: 'API hub', link: '/reference/api' },
						{ text: 'Core runtime', link: '/reference/core' },
						{ text: 'Plugins and orchestration', link: '/reference/plugins' },
						{ text: 'Persistence helpers', link: '/reference/persistence' },
						{ text: 'Public types', link: '/reference/types' }
					]
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
