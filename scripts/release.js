#!/usr/bin/env node
/**
 * End-to-end release orchestrator.
 *
 * Usage: pnpm release <version> [--dry-run]
 *
 * Flow:
 *   1.  Validate version arg and verify prerequisites (git, npm auth, GitHub token).
 *   2.  Confirm working tree is clean and HEAD is on main.
 *   3.  Use GitHub API to generate release notes from commits since the last tag.
 *   4.  Update package.json to the requested version and prepend release notes to CHANGELOG.md.
 *   5.  Commit and push to main.
 *   6.  Poll GitHub Actions until the CI workflow passes on that commit.
 *   7.  Dispatch the Release workflow via the GitHub API (it creates the tag and publishes the Release).
 *   8.  Poll GitHub Actions until the Release workflow completes.
 *   9.  Build dist/ and publish to npm (--no-provenance when running locally).
 *
 * Rollback:
 *   Automatically triggered on failure or SIGINT/SIGTERM.
 *   - If tag was pushed: deletes it from remote and local.
 *   - If commit was pushed: runs `git revert HEAD && git push origin main`.
 *   - If commit was only local: runs `git reset --hard HEAD~1`.
 *   - npm publish is never retried automatically.
 */

// Disable husky so pre-push hooks don't re-run tests on every git push we make.
process.env.HUSKY = '0';

import { Octokit } from '@octokit/rest';
import { spawnSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const OWNER = 'selfagency';
const REPO = 'stately';
const NPM_REGISTRY = process.env.NPM_CONFIG_REGISTRY || 'https://registry.npmjs.org/';

const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('--'));
const isDryRun = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// Rollback state
// ---------------------------------------------------------------------------

let commitLocal = false;
let commitPushed = false;
let tagPushed = false;
let npmPublished = false;

// Initialised inside main() once the GitHub token is available; used by rollback.
let octokit = null;

async function rollback(tag) {
	if (npmPublished) {
		console.error('⚠️  npm publish already completed — cannot roll back. Unpublish manually if needed.');
		return;
	}

	if (tagPushed) {
		console.error(`🔁 Rolling back: deleting remote tag ${tag}…`);
		// Try the git protocol first; if the repository ruleset blocks it fall back to the API.
		const { status } = run('git', ['push', 'origin', `--delete`, tag], { allowFailure: true });
		if (status !== 0) {
			if (octokit) {
				try {
					await octokit.git.deleteRef({ owner: OWNER, repo: REPO, ref: `tags/${tag}` });
					console.error(`↩️  Remote tag ${tag} deleted.`);
				} catch (apiErr) {
					const detail =
						apiErr instanceof Error
							? `${apiErr.message}${apiErr.status ? ` (HTTP ${apiErr.status})` : ''}`
							: String(apiErr);
					console.error(`⚠️  Could not delete remote tag ${tag} via API: ${detail}`);
					console.error(`   Delete it manually at: https://github.com/${OWNER}/${REPO}/releases/tag/${tag}`);
				}
			} else {
				console.error(`⚠️  Could not delete remote tag ${tag} — repository rules may prevent it.`);
				console.error(`   Delete it manually at: https://github.com/${OWNER}/${REPO}/releases/tag/${tag}`);
			}
		}
		run('git', ['tag', '-d', tag], { allowFailure: true });
	}

	if (commitPushed) {
		console.error('🔁 Rolling back: reverting release commit on origin/main…');
		const { status } = run('git', ['revert', '--no-edit', 'HEAD'], { allowFailure: true });
		if (status === 0) {
			run('git', ['push', 'origin', 'main'], { allowFailure: true });
			console.error('↩️  Release commit reverted and pushed.');
		} else {
			console.error('❌ Auto-revert failed. Manually run:');
			console.error('   git revert HEAD && git push origin main');
		}
	} else if (commitLocal) {
		console.error('🔁 Rolling back: resetting local release commit…');
		const { status } = run('git', ['reset', '--hard', 'HEAD~1'], { allowFailure: true });
		if (status === 0) {
			console.error('↩️  Local release commit removed. Working tree restored.');
		} else {
			console.error('❌ Reset failed. Manually run: git reset --hard HEAD~1');
		}
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
		throw new Error(`Command failed: ${command} ${args.join(' ')} (exit ${result.status ?? 1})`);
	}

	return { status: result.status ?? 0, stdout: (result.stdout ?? '').trim() };
}

// ---------------------------------------------------------------------------
// Workflow polling
// ---------------------------------------------------------------------------

/**
 * @param {Octokit} octokit
 * @param {string} workflowName
 * @param {string} headSha
 * @param {ReturnType<typeof ora>} spinner
 * @param {{ pollMs?: number, timeoutMs?: number, branch?: string | null }} [opts]
 */
async function waitForWorkflow(
	octokit,
	workflowName,
	headSha,
	spinner,
	{ pollMs = 15_000, timeoutMs = 3_600_000, branch = 'main' } = {}
) {
	const {
		data: { workflows }
	} = await octokit.actions.listRepoWorkflows({ owner: OWNER, repo: REPO, per_page: 100 });
	const workflow = workflows.find((w) => w.name === workflowName);
	if (!workflow) throw new Error(`Workflow "${workflowName}" not found in repository.`);

	const deadline = Date.now() + timeoutMs;
	const cancelledRunIds = new Set();

	while (Date.now() < deadline) {
		const {
			data: { workflow_runs }
		} = await octokit.actions.listWorkflowRuns({
			owner: OWNER,
			repo: REPO,
			workflow_id: workflow.id,
			head_sha: headSha,
			...(branch ? { branch } : {}),
			per_page: 10
		});

		const run = workflow_runs.find((r) => !cancelledRunIds.has(r.id));

		if (!run) {
			spinner.text = `${workflowName}: waiting for run to appear…`;
		} else if (run.status !== 'completed') {
			const elapsed = Math.round((Date.now() - new Date(run.created_at).getTime()) / 1000);
			spinner.text = `${workflowName}: ${run.status} (${elapsed}s)`;
		} else if (run.conclusion === 'success') {
			spinner.succeed(`${workflowName}: passed`);
			return;
		} else if (run.conclusion === 'cancelled') {
			cancelledRunIds.add(run.id);
			spinner.text = `${workflowName}: run cancelled, waiting for retry…`;
		} else {
			spinner.fail(`${workflowName}: ${run.conclusion}`);
			throw new Error(`Workflow "${workflowName}" completed with conclusion: ${run.conclusion}. See: ${run.html_url}`);
		}

		await new Promise((r) => setTimeout(r, pollMs));
	}

	spinner.fail(`${workflowName}: timed out`);
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

	// --- GitHub auth ---------------------------------------------------------

	let githubToken = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? '';
	if (!githubToken) {
		const { status, stdout } = run('gh', ['auth', 'token'], { capture: true, allowFailure: true });
		if (status !== 0 || !stdout) {
			console.error('GitHub token not found. Set GH_TOKEN, GITHUB_TOKEN, or run `gh auth login`.');
			process.exit(1);
		}
		githubToken = stdout;
	}

	octokit = new Octokit({ auth: githubToken });

	// --- npm credentials -----------------------------------------------------

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

	// Check for existing local tag.
	const localTag = run('git', ['tag', '-l', tag], { capture: true }).stdout;
	if (localTag) {
		console.error(`Tag ${tag} already exists locally. Run: git tag -d ${tag}`);
		process.exit(1);
	}

	// Check for existing remote tag — avoids a rejected push mid-release.
	const remoteTag = run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`], { capture: true }).stdout;
	if (remoteTag) {
		console.error(`Tag ${tag} already exists on remote. Delete it before re-running:`);
		console.error(`  https://github.com/${OWNER}/${REPO}/releases/tag/${tag}`);
		process.exit(1);
	}

	// --- Resolve previous tag for release notes diff ------------------------

	const { data: matchingRefs } = await octokit.git.listMatchingRefs({ owner: OWNER, repo: REPO, ref: 'tags/v' });
	const previousTag =
		matchingRefs
			.map((r) => r.ref.replace('refs/tags/', ''))
			.filter((t) => t !== tag)
			.sort((a, b) => {
				const parse = (v) => v.replace(/^v/, '').split('.').map(Number);
				const [aMaj, aMin, aPatch] = parse(a);
				const [bMaj, bMin, bPatch] = parse(b);
				return aMaj - bMaj || aMin - bMin || aPatch - bPatch;
			})
			.at(-1) ?? '';

	// --- Generate release notes via GitHub API --------------------------------

	console.log(`📝 Generating release notes for ${tag}…`);
	const { data: notesData } = await octokit.repos.generateReleaseNotes({
		owner: OWNER,
		repo: REPO,
		tag_name: tag,
		target_commitish: 'main',
		...(previousTag ? { previous_tag_name: previousTag } : {})
	});
	const releaseNotes = notesData.body?.trim() || '- No notable changes.';

	// --- Update package.json -------------------------------------------------

	const pkgPath = resolve(ROOT, 'package.json');
	const pkg = await readJson(pkgPath);
	if (pkg.version !== version) {
		pkg.version = version;
		await writeJson(pkgPath, pkg);
	}

	// --- Update CHANGELOG.md -------------------------------------------------

	const changelogPath = resolve(ROOT, 'CHANGELOG.md');
	const date = new Date().toISOString().slice(0, 10);
	const heading = `## [${version}] - ${date}`;
	const sourceLine = previousTag ? `\n\n_Source: changes from ${previousTag} to ${tag}._` : '';
	const section = `\n${heading}\n\n${releaseNotes}${sourceLine}\n`;

	let changelog;
	try {
		changelog = await readFile(changelogPath, 'utf8');
	} catch {
		changelog = '# Changelog\n\n## [Unreleased]\n';
	}

	if (!changelog.includes(heading)) {
		const marker = '## [Unreleased]';
		const idx = changelog.indexOf(marker);
		const updated =
			idx >= 0
				? `${changelog.slice(0, idx + marker.length)}\n${section}${changelog.slice(idx + marker.length)}`
				: `${changelog}\n${section}`;
		await writeFile(changelogPath, updated, 'utf8');
	} else {
		console.log('ℹ️  CHANGELOG already contains this release heading; skipping.');
	}

	// --- Dry run exit --------------------------------------------------------

	if (isDryRun) {
		console.log(`\n[dry-run] Would commit, push, wait for CI, tag ${tag}, push tag, wait for Release, then publish.`);
		console.log(`[dry-run] package.json version: ${version}`);
		console.log(`[dry-run] Release notes preview:\n${releaseNotes}`);
		return;
	}

	// --- Commit + push to main -----------------------------------------------

	const hasChanges = run('git', ['diff', '--name-only', '--', 'package.json', 'CHANGELOG.md'], {
		capture: true
	}).stdout;
	if (hasChanges) {
		run('git', ['add', '--', 'package.json', 'CHANGELOG.md']);
		run('git', ['commit', '-m', `chore: release ${tag}`]);
		commitLocal = true;
	} else {
		console.log('No file changes to commit (version may already match).');
	}

	console.log('🚀 Pushing main…');
	run('git', ['push', 'origin', 'main']);
	commitPushed = true;
	commitLocal = false;

	const headSha = run('git', ['rev-parse', 'HEAD'], { capture: true }).stdout;

	// --- Wait for CI ---------------------------------------------------------

	console.log(`\n🔎 Waiting for CI on ${headSha.slice(0, 7)}…`);
	await new Promise((r) => setTimeout(r, 10_000));
	const ciSpinner = ora('CI: queued').start();
	await waitForWorkflow(octokit, 'CI', headSha, ciSpinner);
	console.log('✅ CI passed.');

	// --- Dispatch Release workflow (creates tag + builds GitHub Release) ------

	// The repository has a ruleset that restricts tag creation to GitHub Actions.
	// Rather than pushing the tag locally (which would be rejected), we dispatch
	// the release.yml workflow.  The workflow's GITHUB_TOKEN is in the bypass list
	// and will create the annotated tag, build the package, and publish the release.
	// The workflow re-fetches the latest main SHA right before comparing against the
	// tag, so a concurrent push to main between dispatch and verification will be
	// caught and the release will be blocked.
	console.log(`🏷️  Dispatching release workflow for ${tag}…`);
	await octokit.actions.createWorkflowDispatch({
		owner: OWNER,
		repo: REPO,
		workflow_id: 'release.yml',
		ref: 'main',
		inputs: { version }
	});
	// Optimistically flag that the workflow will create the remote tag so that
	// rollback knows to attempt deletion if anything fails before npm publish.
	tagPushed = true;

	// --- Wait for Release workflow -------------------------------------------

	const releaseSpinner = ora('Release: waiting for workflow to trigger…').start();
	await waitForWorkflow(octokit, 'Release', headSha, releaseSpinner, { branch: null });
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
