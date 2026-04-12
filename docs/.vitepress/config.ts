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
						{ text: 'Plugins', link: '/guide/plugins' },
						{ text: 'Finite state machines', link: '/guide/fsm' },
						{ text: 'Validation', link: '/guide/validation' },
						{ text: 'SSR and SvelteKit', link: '/guide/ssr-and-sveltekit' },
						{ text: 'SvelteKit data loading', link: '/guide/sveltekit-data-loading' },
						{ text: 'Inspector', link: '/guide/inspector' },
						{ text: 'Examples and recipes', link: '/guide/examples' }
					]
				},
				{
					text: 'Operations',
					items: [
						{ text: 'Testing and releases', link: '/guide/testing-and-releases' },
						{ text: 'Migration from Pinia', link: '/guide/migration-from-pinia' },
						{ text: 'AI agent skill', link: '/guide/ai-agent-skill' },
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
						{ text: 'Finite state machines', link: '/reference/fsm' },
						{ text: 'Validation', link: '/reference/validation' },
						{ text: 'Inspector', link: '/reference/inspector' },
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
