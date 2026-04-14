import { codecovVitePlugin } from '@codecov/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { statelyVitePlugin } from './src/lib/inspector/vite-plugin.js';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    !process.env.VITEST &&
      statelyVitePlugin({
        buttonPosition: 'right-bottom',
        panelSide: 'right'
      }),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: '@selfagency/stately',
      uploadToken: process.env.CODECOV_TOKEN
    })
  ],
  test: {
    expect: { requireAssertions: true },
    typecheck: {
      include: ['src/**/*.test-d.ts']
    },
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      exclude: [
        'src/lib/examples/**',
        'src/lib/vitest-examples/**',
        'src/lib/components/**',
        'src/lib/hooks/**',
        'src/lib/**/index.ts',
        'src/lib/**/types.ts',
        'src/lib/**/*.d.ts',
        'src/lib/**/*.css',
        'src/lib/inspector/runtime/**'
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    },
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'client',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }]
          },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**']
        }
      },

      {
        extends: './vite.config.ts',
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
        }
      },

      {
        extends: './vite.config.ts',
        test: {
          name: 'typechecking',
          expect: { requireAssertions: false },
          typecheck: {
            enabled: true,
            include: ['src/**/*.test-d.ts'],
            // tsc cannot resolve types re-exported from .svelte files in the
            // showcase UI components (shadcn-svelte). Those are covered by
            // svelte-check (pnpm run check). Library source has no tsc errors.
            ignoreSourceErrors: true
          },
          include: ['src/**/*.test-d.ts']
        }
      }
    ]
  }
});
