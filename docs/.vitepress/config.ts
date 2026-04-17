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
    ['link', { rel: 'api-catalog', href: '/.well-known/api-catalog' }],
    ['link', { rel: 'service-doc', href: '/reference/api' }],
    ['link', { rel: 'service-doc', href: '/guide/' }],
    ['link', { rel: 'describedby', href: '/.well-known/agent-skills/index.json', type: 'application/json' }],
    ['link', { rel: 'service-desc', href: '/.well-known/mcp/server-card.json', type: 'application/json' }],
    [
      'meta',
      {
        'http-equiv': 'Link',
        content:
          '</.well-known/api-catalog>; rel="api-catalog", </reference/api>; rel="service-doc", </guide/>; rel="service-doc"'
      }
    ],
    [
      'script',
      {
        type: 'module'
      },
      `
      const STATELY_TOOLS = [
        {
          name: 'search_stately_docs',
          description: 'Search Stately docs for relevant guides and references.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' }
            },
            required: ['query']
          },
          execute: async (input) => {
            const query = String(input?.query || '').toLowerCase();
            const map = {
              persistence: '/reference/persistence',
              plugins: '/guide/plugins',
              define: '/guide/define-store',
              fsm: '/guide/fsm',
              validation: '/guide/validation',
              ssr: '/guide/ssr-and-sveltekit',
              inspector: '/guide/inspector'
            };

            for (const [k, v] of Object.entries(map)) {
              if (query.includes(k) || k.includes(query)) {
                return { url: 'https://stately.self.agency' + v };
              }
            }

            return { url: 'https://stately.self.agency/guide/' };
          }
        },
        {
          name: 'get_stately_feature_info',
          description: 'Get concise information about a Stately feature.',
          inputSchema: {
            type: 'object',
            properties: {
              feature: {
                type: 'string',
                enum: ['persistence', 'plugins', 'fsm', 'validation', 'sync', 'history', 'async', 'inspector']
              }
            },
            required: ['feature']
          },
          execute: async (input) => {
            const feature = String(input?.feature || '');
            const info = {
              persistence: 'Persistence adapters for localStorage, sessionStorage, IndexedDB, and memory.',
              plugins: 'Tree-shakable plugin model using createStateManager().use().',
              fsm: 'Finite-state-machine support for orchestrating store transitions.',
              validation: 'Validation helpers for store state and actions.',
              sync: 'Multi-tab synchronization via BroadcastChannel and storage events.',
              history: 'Undo/redo and snapshot-based history support.',
              async: 'Async orchestration with loading/error tracking and cancellation.',
              inspector: 'Runtime inspector hooks and documentation.'
            };
            return { feature, summary: info[feature] || 'Unknown feature' };
          }
        }
      ];

      function registerWithProvideContext(modelContext) {
        if (typeof modelContext.provideContext !== 'function') return false;
        try {
          modelContext.provideContext({ tools: STATELY_TOOLS });
          return true;
        } catch {
          try {
            modelContext.provideContext(STATELY_TOOLS);
            return true;
          } catch {
            return false;
          }
        }
      }

      function registerWithImperativeApi(modelContext) {
        if (typeof modelContext.registerTool !== 'function') return false;
        let ok = false;
        for (const tool of STATELY_TOOLS) {
          try {
            modelContext.registerTool({ ...tool, title: tool.name, annotations: { readOnlyHint: true } });
            ok = true;
          } catch {
            // no-op
          }
        }
        return ok;
      }

      function attemptWebMcpRegistration(attempt = 0) {
        if (typeof navigator === 'undefined' || !navigator.modelContext) {
          if (attempt < 20) setTimeout(() => attemptWebMcpRegistration(attempt + 1), 100);
          return;
        }

        const modelContext = navigator.modelContext;
        const provided = registerWithProvideContext(modelContext);
        const registered = provided || registerWithImperativeApi(modelContext);

        if (!registered && attempt < 20) {
          setTimeout(() => attemptWebMcpRegistration(attempt + 1), 100);
        }
      }

      attemptWebMcpRegistration();
      window.addEventListener('DOMContentLoaded', () => attemptWebMcpRegistration());
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
