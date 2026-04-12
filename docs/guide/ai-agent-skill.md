# AI Agent Skill

Stately ships an [AI agent skill](https://github.com/antfu/skills-npm) that helps LLM coding agents
(Cursor, Windsurf, GitHub Copilot, etc.) work with the library correctly. The skill is automatically
symlinked into your project's agent configuration directory when you run `pnpm install`, so agents
always have accurate, up-to-date context about the Stately API.

## Setup

1. Install [`skills-npm`](https://github.com/antfu/skills-npm) in your project:

   ```sh
   pnpm add -D skills-npm
   ```

2. Add a `prepare` script so skills are symlinked on install:

   ```jsonc
   // package.json
   {
   	"scripts": {
   		"prepare": "skills-npm"
   	}
   }
   ```

   If you already have a `prepare` script, chain them:

   ```json
   "prepare": "husky && skills-npm"
   ```

3. Add the symlink output to `.gitignore`:

   ```gitignore
   skills/npm-*
   ```

4. Run `pnpm install` — the Stately skill will be symlinked into your agent's skills directory
   automatically.

## Custom configuration

Use a `skills-npm.config.ts` to restrict which agents or packages get skills:

```ts
import { defineConfig } from 'skills-npm';

export default defineConfig({
	agents: ['cursor', 'windsurf'],
	include: ['@selfagency/stately']
});
```

See the [skills-npm docs](https://github.com/antfu/skills-npm) for all configuration options.

## What the skill covers

The Stately skill teaches agents:

- The `defineStore()` option and setup store APIs.
- How to compose plugins — persistence, history, sync, async, FSM, validation.
- SSR-safe patterns with request-scoped managers and Svelte context.
- The `$patch`, `$reset`, `$subscribe`, `$onAction`, and `$dispose` lifecycle methods.
- Inspector integration and the Vite plugin.
- Common pitfalls (singleton state on the server, destructuring reactivity loss, etc.).
