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
  sitemap: {
    hostname: 'https://stately.self.agency'
  },
  head: [
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/stately.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/stately.svg' }],
    [
      'script',
      {
        type: 'module',
        async: true
      },
      `
      // Register WebMCP tools for AI agents
      function registerWebMCPTools() {
        if (!navigator.modelContext || typeof navigator.modelContext.registerTool !== 'function') {
          return;
        }

        const tools = [
          {
            name: 'search-stately-docs',
            title: 'Search Stately Documentation',
            description: 'Search the Stately documentation for features, guides, and API references.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (e.g., "persistence", "define store", "plugins")'
                }
              },
              required: ['query']
            },
            execute: async (input) => {
              const query = String(input?.query || '').toLowerCase();
              const sections = {
                'define-store': { title: 'Define stores', url: '/guide/define-store' },
                'plugins': { title: 'Plugins guide', url: '/guide/plugins' },
                'persistence': { title: 'Persistence reference', url: '/reference/persistence' },
                'history': { title: 'Plugins reference', url: '/reference/plugins' },
                'sync': { title: 'Plugins reference', url: '/reference/plugins' },
                'async': { title: 'Plugins reference', url: '/reference/plugins' },
                'fsm': { title: 'FSM guide', url: '/guide/fsm' },
                'validation': { title: 'Validation guide', url: '/guide/validation' },
                'ssr': { title: 'SSR and SvelteKit', url: '/guide/ssr-and-sveltekit' },
                'inspector': { title: 'Inspector guide', url: '/guide/inspector' }
              };
              
              for (const [key, section] of Object.entries(sections)) {
                if (query.includes(key) || key.includes(query)) {
                  return 'Visit: https://stately.self.agency' + section.url;
                }
              }
              return 'Documentation available at https://stately.self.agency/guide/';
            },
            annotations: { readOnlyHint: true }
          },
          {
            name: 'get-stately-feature-info',
            title: 'Get Stately Feature Information',
            description: 'Learn about Stately features like persistence, plugins, FSM, and validation.',
            inputSchema: {
              type: 'object',
              properties: {
                feature: {
                  type: 'string',
                  enum: ['persistence', 'plugins', 'fsm', 'validation', 'sync', 'history', 'async', 'inspector'],
                  description: 'Feature to learn about'
                }
              },
              required: ['feature']
            },
            execute: async (input) => {
              const info = {
                persistence: 'Persist store state to localStorage, sessionStorage, IndexedDB, or memory with TTL, compression, and filtering.',
                plugins: 'Tree-shakable plugin system for extending stores with persistence, history, sync, async, and custom functionality.',
                fsm: 'Finite state machines for modeling complex workflows with type-safe state transitions.',
                validation: 'Input validation with schema definitions integrated with store actions.',
                sync: 'Multi-tab synchronization via BroadcastChannel and storage events.',
                history: 'Undo/redo history with snapshots and time-travel debugging.',
                async: 'Async orchestration with loading states, error tracking, and concurrency control.',
                inspector: 'Browser DevTools integration for inspecting state, actions, and history.'
              };
              return info[input?.feature] || 'Feature not found';
            },
            annotations: { readOnlyHint: true }
          }
        ];

        for (const tool of tools) {
          try {
            navigator.modelContext.registerTool(tool);
          } catch (error) {
            console.debug('Failed to register WebMCP tool:', error);
          }
        }
      }

      if (typeof window !== 'undefined') {
        registerWebMCPTools();
      }
      `
    ]
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
