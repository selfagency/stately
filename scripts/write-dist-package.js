import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const INSPECTOR_VIRTUAL_OPTIONS_SOURCE = resolve(ROOT, 'src/lib/inspector/virtual-options.d.ts');
const INSPECTOR_VIRTUAL_OPTIONS_DEST = resolve(DIST, 'inspector/virtual-options.d.ts');
const INSPECTOR_VITE_PLUGIN_TYPES_DEST = resolve(DIST, 'inspector/vite-plugin.d.ts');
const INSPECTOR_VIRTUAL_REFERENCE = '/// <reference path="./virtual-options.d.ts" />';
const TEST_OUTPUT_PATTERN = /\.(?:test|spec)\.(?:d\.)?[cm]?[jt]s$/;
const RELEASE_ASSETS = ['README.md', 'CHANGELOG.md', 'LICENSE.md', 'stately.svg'];

async function pruneReleaseExtras(directory) {
	const entries = await readdir(directory, { withFileTypes: true });

	for (const entry of entries) {
		const entryPath = resolve(directory, entry.name);

		if (entry.isDirectory()) {
			if (entry.name === 'vitest-examples' || entry.name === '__snapshots__') {
				await rm(entryPath, { recursive: true, force: true });
				continue;
			}

			await pruneReleaseExtras(entryPath);
			continue;
		}

		if (TEST_OUTPUT_PATTERN.test(entry.name) || entry.name.endsWith('.snap')) {
			await rm(entryPath, { force: true });
		}
	}
}

async function copyReleaseAssets() {
	for (const asset of RELEASE_ASSETS) {
		await copyFile(resolve(ROOT, asset), resolve(DIST, asset));
	}

	await mkdir(dirname(INSPECTOR_VIRTUAL_OPTIONS_DEST), { recursive: true });
	await copyFile(INSPECTOR_VIRTUAL_OPTIONS_SOURCE, INSPECTOR_VIRTUAL_OPTIONS_DEST);
}

async function wireInspectorTypeReferences() {
	const source = await readFile(INSPECTOR_VITE_PLUGIN_TYPES_DEST, 'utf8');
	if (source.startsWith(INSPECTOR_VIRTUAL_REFERENCE)) {
		return;
	}

	await writeFile(INSPECTOR_VITE_PLUGIN_TYPES_DEST, `${INSPECTOR_VIRTUAL_REFERENCE}\n${source}`, 'utf8');
}

function rewriteDistPaths(value) {
	if (typeof value === 'string') {
		return value.startsWith('./dist/') ? './' + value.slice('./dist/'.length) : value;
	}
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewriteDistPaths(v)]));
	}
	return value;
}

async function writeDistPackage() {
	const rawPackage = await readFile(resolve(ROOT, 'package.json'), 'utf8');
	const packageJson = JSON.parse(rawPackage);
	const {
		name,
		version,
		description,
		keywords,
		homepage,
		bugs,
		repository,
		license,
		type,
		exports,
		svelte,
		types,
		sideEffects,
		dependencies,
		peerDependencies,
		publishConfig
	} = packageJson;

	const distPackage = {
		name,
		version,
		description,
		keywords,
		homepage,
		bugs,
		repository,
		license,
		type,
		main: './index.js',
		module: './index.js',
		svelte: rewriteDistPaths(svelte),
		types: rewriteDistPaths(types),
		exports: rewriteDistPaths(exports),
		sideEffects,
		publishConfig
	};

	if (dependencies && Object.keys(dependencies).length > 0) {
		distPackage.dependencies = dependencies;
	}

	if (peerDependencies && Object.keys(peerDependencies).length > 0) {
		distPackage.peerDependencies = peerDependencies;
	}

	await writeFile(resolve(DIST, 'package.json'), `${JSON.stringify(distPackage, null, 2)}\n`, 'utf8');
}

async function main() {
	await mkdir(DIST, { recursive: true });
	await pruneReleaseExtras(DIST);
	await copyReleaseAssets();
	await wireInspectorTypeReferences();
	await writeDistPackage();
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
