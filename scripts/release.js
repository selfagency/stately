#!/usr/bin/env node
/**
 * End-to-end release orchestrator.
 *
 * Usage: pnpm release <version> [--dry-run]
 *
 * Flow:
 *   1.  Validate version arg and verify prerequisites (git, npm auth, GitHub token).
 *   2.  Confirm working tree is clean and HEAD is on main.
 *   3.  Run `changeset version` to consume pending changesets and update CHANGELOG.md.
 *   4.  Re-assert the requested version in package.json.
 *   5.  Commit and push to main.
 *   6.  Poll GitHub Actions until the CI workflow passes on that commit.
 *   7.  Create an annotated tag and push it.
 *   8.  Poll GitHub Actions until the Release workflow completes.
 *   9.  Build dist/ and publish to npm (--no-provenance when running locally).
 *
 * Rollback:
 *   If any step fails after the commit has been pushed, the script attempts to
 *   delete the remote tag (if it was pushed) and warns about the commit.
 *   npm publish is never retried; if it fails, re-run with `pnpm release:publish`.
 */

import { spawnSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const GITHUB_API = 'https://api.github.com';
const OWNER = 'selfagency';
const REPO = 'stately';
const NPM_REGISTRY = process.env.NPM_CONFIG_REGISTRY || 'https://registry.npmjs.org/';

const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('--'));
const isDryRun = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// Rollback state
// ---------------------------------------------------------------------------

let commitPushed = false;
let tagPushed = false;
let npmPublished = false;

async function rollback(tag) {
	if (npmPublished) {
		console.error('⚠️  npm publish already completed — cannot roll back. Unpublish manually if needed.');
		return;
	}

	if (tagPushed) {
		try {
			console.error(`🔁 Rolling back: deleting remote tag ${tag}...`);
			run('git', ['push', 'origin', `--delete`, tag], { allowFailure: true });
			run('git', ['tag', '-d', tag], { allowFailure: true });
		} catch (err) {
			console.error('Rollback failed:', err instanceof Error ? err.message : err);
		}
	}

	if (commitPushed) {
		console.error(`⚠️  Release commit was pushed to origin/main. Fix the issue and re-run, or revert manually.`);
	}
}

process.on('SIGINT', async () => {
	await rollback(`v${version ?? ''}`);
	process.exit(130);
});

process.on('SIGTERM', async () => {
	await rollback(`v${version ?? ''}`);
	process.exit(143);
});

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ allowFailure?: boolean, capture?: boolean }} [opts]
 */
function run(command, args, { allowFailure = false, capture = false } = {}) {
	const result = spawnSync(command, args, {
		cwd: ROOT,
		stdio: capture ? 'pipe' : 'inherit',
		encoding: 'utf8',
		env: process.env,
		shell: false
	});

	if (result.status !== 0 && !allowFailure) {
		process.exit(result.status ?? 1);
	}

	return { status: result.status ?? 0, stdout: (result.stdout ?? '').trim() };
}

// ---------------------------------------------------------------------------
// GitHub API helpers (native fetch, Node 20+)
// ---------------------------------------------------------------------------

function githubHeaders(token) {
	return {
		Accept: 'application/vnd.github+json',
		Authorization: `Bearer ${token}`,
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'stately-release-script'
	};
}

async function githubGet(path, token) {
	const res = await fetch(`${GITHUB_API}${path}`, { headers: githubHeaders(token) });
	if (!res.ok) throw new Error(`GitHub API ${path} → ${res.status} ${res.statusText}`);
	return res.json();
}

/**
 * Polls until the named workflow has a completed run for `headSha` on main.
 * Returns the final conclusion string.
 *
 * @param {string} workflowName
 * @param {string} headSha
 * @param {string} token
 * @param {{ pollMs?: number, timeoutMs?: number, branch?: string | null }} [opts]
 */
async function waitForWorkflow(
	workflowName,
	headSha,
	token,
	{ pollMs = 15_000, timeoutMs = 3_600_000, branch = 'main' } = {}
) {
	const workflows = await githubGet(`/repos/${OWNER}/${REPO}/actions/workflows?per_page=100`, token);
	const workflow = workflows.workflows.find((w) => w.name === workflowName);

	if (!workflow) throw new Error(`Workflow "${workflowName}" not found in repository.`);

	const deadline = Date.now() + timeoutMs;
	const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : '';

	while (Date.now() < deadline) {
		const runs = await githubGet(
			`/repos/${OWNER}/${REPO}/actions/workflows/${workflow.id}/runs?head_sha=${headSha}${branchParam}&per_page=10`,
			token
		);

		const run = runs.workflow_runs[0];

		if (run) {
			const status = run.status;
			const conclusion = run.conclusion;

			if (status === 'completed') {
				if (conclusion === 'success') {
					return conclusion;
				}
				throw new Error(`Workflow "${workflowName}" completed with conclusion: ${conclusion}. See: ${run.html_url}`);
			}

			process.stdout.write(`\r  ${workflowName}: ${status}…`);
		} else {
			process.stdout.write(`\r  ${workflowName}: waiting for run to appear…`);
		}

		await new Promise((resolve) => setTimeout(resolve, pollMs));
	}

	throw new Error(`Timed out waiting for workflow "${workflowName}" on ${headSha}.`);
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
	await writeFile(filePath, JSON.stringify(data, null, '\t') + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	if (!version) {
		console.error('Usage: pnpm release <version> [--dry-run]');
		process.exit(1);
	}

	if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(version)) {
		console.error(`Invalid version: "${version}". Expected semver, e.g. 1.2.3 or 1.2.3-beta.1`);
		process.exit(1);
	}

	const tag = `v${version}`;

	// --- Prerequisites -------------------------------------------------------

	const githubToken = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? '';
	if (!githubToken) {
		// Try to get token from gh CLI.
		const { status, stdout } = run('gh', ['auth', 'token'], { capture: true, allowFailure: true });
		if (status !== 0 || !stdout) {
			console.error('GitHub token not found. Set GH_TOKEN, GITHUB_TOKEN, or run `gh auth login`.');
			process.exit(1);
		}
		process.env.GH_TOKEN = stdout;
	}

	const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;

	// Verify npm credentials before touching git.
	if (!isDryRun) {
		console.log('🔑 Verifying npm credentials…');
		const { status } = run('npm', ['whoami', '--registry', NPM_REGISTRY], { allowFailure: true, capture: true });
		if (status !== 0) {
			console.error('npm auth check failed. Run `npm login` or set NPM_TOKEN.');
			process.exit(1);
		}
	}

	// --- Git preconditions ---------------------------------------------------

	const dirty = run('git', ['status', '--porcelain'], { capture: true }).stdout;
	if (dirty) {
		console.error('Working tree is dirty. Commit or stash changes before releasing.');
		process.exit(1);
	}

	const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { capture: true }).stdout;
	if (branch !== 'main') {
		console.error(`Releases must be cut from main. Currently on: ${branch}`);
		process.exit(1);
	}

	console.log('🔄 Fetching latest refs…');
	run('git', ['fetch', 'origin', 'main']);
	run('git', ['pull', '--ff-only', 'origin', 'main']);

	// Check for existing tag.
	const localTag = run('git', ['tag', '-l', tag], { capture: true }).stdout;
	if (localTag) {
		console.error(`Tag ${tag} already exists locally.`);
		process.exit(1);
	}

	// --- Changeset version + explicit version assertion ----------------------

	console.log('🧩 Consuming changesets…');
	run('pnpm', ['changeset', 'version'], { allowFailure: true });

	const pkgPath = resolve(ROOT, 'package.json');
	const pkg = await readJson(pkgPath);
	if (pkg.version !== version) {
		pkg.version = version;
		await writeJson(pkgPath, pkg);
	}

	// --- Dry run exit --------------------------------------------------------

	if (isDryRun) {
		console.log(`\n[dry-run] Would commit, push, wait for CI, tag ${tag}, push tag, wait for Release, then publish.`);
		console.log(`[dry-run] package.json version: ${version}`);
		return;
	}

	// --- Commit + push to main -----------------------------------------------

	const hasChanges = run('git', ['diff', '--name-only', '--', 'package.json', 'CHANGELOG.md', '.changeset'], {
		capture: true
	}).stdout;
	if (hasChanges) {
		run('git', ['add', '--', 'package.json', 'CHANGELOG.md', '.changeset']);
		run('git', ['commit', '-m', `chore: release ${tag}`]);
	} else {
		console.log('No file changes to commit (version may already match).');
	}

	console.log('🚀 Pushing main…');
	run('git', ['push', 'origin', 'main']);
	commitPushed = true;

	const headSha = run('git', ['rev-parse', 'HEAD'], { capture: true }).stdout;

	// --- Wait for CI ---------------------------------------------------------

	console.log(`\n🔎 Waiting for CI on ${headSha.slice(0, 7)}…`);
	await new Promise((r) => setTimeout(r, 10_000)); // Give GitHub time to register the push.
	await waitForWorkflow('CI', headSha, token);
	process.stdout.write('\n');
	console.log('✅ CI passed.');

	// --- Tag + push ----------------------------------------------------------

	console.log(`🏷️  Tagging ${tag}…`);
	run('git', ['tag', '-a', tag, headSha, '-m', `Release ${tag}`]);
	run('git', ['push', 'origin', tag]);
	tagPushed = true;

	// --- Wait for Release workflow -------------------------------------------

	console.log(`\n🔎 Waiting for Release workflow…`);
	await waitForWorkflow('Release', headSha, token, { branch: null });
	process.stdout.write('\n');
	console.log('✅ GitHub Release created.');

	// --- Build + publish to npm ----------------------------------------------

	console.log('📦 Building dist/…');
	run('pnpm', ['run', 'build']);

	// Verify artifacts.
	for (const required of ['package.json', 'README.md', 'CHANGELOG.md', 'LICENSE.md', 'stately.svg']) {
		await access(resolve(DIST, required), constants.R_OK);
	}

	const distPkg = await readJson(resolve(DIST, 'package.json'));
	const rootPkg = await readJson(pkgPath);
	if (rootPkg.version !== distPkg.version) {
		throw new Error(`Version mismatch: root=${rootPkg.version} dist=${distPkg.version}`);
	}

	const distTag = version.includes('-') ? 'next' : 'latest';
	const publishArgs = ['publish', './dist', '--tag', distTag, '--registry', NPM_REGISTRY, '--access', 'public'];

	// Provenance requires OIDC — only available inside GitHub Actions.
	if (process.env.CI) {
		publishArgs.push('--provenance');
	} else {
		publishArgs.push('--no-provenance');
	}

	console.log(`📤 Publishing @selfagency/stately@${version} to npm…`);
	run('npm', publishArgs);
	npmPublished = true;

	console.log(`\n✅ Released @selfagency/stately@${version} (tag: ${distTag})`);
	console.log(`   https://www.npmjs.com/package/@selfagency/stately\n`);
}

main().catch(async (error) => {
	process.stdout.write('\n');
	console.error(error instanceof Error ? error.message : error);
	await rollback(`v${version ?? ''}`);
	process.exit(1);
});
