#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const NPM_REGISTRY = process.env.NPM_CONFIG_REGISTRY || 'https://registry.npmjs.org/';
const isDryRun = process.argv.includes('--dry-run');

function run(command, args) {
	const result = spawnSync(command, args, {
		cwd: ROOT,
		stdio: 'inherit',
		env: process.env,
		shell: false
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

async function readJson(path) {
	return JSON.parse(await readFile(path, 'utf8'));
}

async function assertReleaseArtifacts() {
	for (const requiredPath of ['package.json', 'README.md', 'CHANGELOG.md', 'LICENSE.md', 'stately.svg']) {
		await access(resolve(DIST, requiredPath), constants.R_OK);
	}
}

async function main() {
	const rootPackage = await readJson(resolve(ROOT, 'package.json'));
	const distPackage = await readJson(resolve(DIST, 'package.json'));

	if (rootPackage.version !== distPackage.version) {
		throw new Error(
			`Release blocked: root version ${rootPackage.version} does not match dist version ${distPackage.version}. Run pnpm build first.`
		);
	}

	await assertReleaseArtifacts();

	const distTag = rootPackage.version.includes('-') ? 'next' : 'latest';
	const publishArgs = ['publish', './dist', '--tag', distTag, '--registry', NPM_REGISTRY];

	if (rootPackage.name?.startsWith('@')) {
		publishArgs.push('--access', 'public');
	}

	if ((distPackage.publishConfig?.provenance ?? rootPackage.publishConfig?.provenance) !== false) {
		publishArgs.push('--provenance');
	}

	if (isDryRun) {
		publishArgs.push('--dry-run');
	}

	run('npm', publishArgs);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
