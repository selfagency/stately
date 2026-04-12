# Releasing Stately

This repository uses Changesets to manage npm versions and changelog entries.
The published npm artifact comes from `dist/`, not from the workspace root package manifest.

## Normal maintainer flow

Run the release script from the `main` branch on your local machine:

```sh
pnpm release <version>
# e.g. pnpm release 1.2.3
```

The script handles the entire flow end-to-end:

1. Verifies npm credentials and GitHub auth (`GH_TOKEN`, `GITHUB_TOKEN`, or `gh auth login`).
2. Confirms the working tree is clean and HEAD is on `main`.
3. Runs `changeset version` to consume any pending changesets and update `CHANGELOG.md`.
4. Asserts the requested version in `package.json`.
5. Commits the version bump and changelog, then pushes to `main`.
6. Polls GitHub Actions until the **CI** workflow passes on that commit.
7. Creates an annotated tag (`v<version>`) and pushes it.
8. Polls GitHub Actions until the **Release** workflow completes and the GitHub Release is published.
9. Builds `dist/` and runs `npm publish ./dist`.

If anything fails after the commit has been pushed, the script rolls back the remote tag and prints guidance for the commit.

## Prerequisites

- Authenticated with npm: `npm login` or `NPM_TOKEN` set in your environment.
- Authenticated with GitHub: `GH_TOKEN` / `GITHUB_TOKEN` env var, or `gh auth login`.
- Node.js ≥ 20 (uses native `fetch` for GitHub API calls).
- Must be on the `main` branch with a clean working tree.

## Dry run

Preview what the script would do without pushing or publishing:

```sh
pnpm release:dry-run <version>
```

## Release package shape

The release build writes a minimal `dist/package.json` that keeps only consumer-facing metadata:

- package name and version
- description, keywords, homepage, bug tracker, and repository metadata
- runtime `dependencies` and `peerDependencies`
- ESM/Svelte entry points and export map
- provenance-aware `publishConfig`

It intentionally drops workspace-only fields such as dev dependencies, local scripts, and contributor tooling.
The release build also removes generated spec files and other test-only artifacts from `dist/` before publishing.

## GitHub Release workflow

The `.github/workflows/release.yml` workflow fires on every `v*` tag push. It:

1. Verifies the tag points to the latest `main` commit and that CI passed on it.
2. Rebuilds the package from source.
3. Packs a tarball and attaches it to the GitHub Release.

**The GitHub workflow does not publish to npm.** npm publishing is done locally by the release script.

## Manual npm publish (recovery)

If the release script completed through the GitHub Release step but the npm publish failed,
re-run the publish step manually:

```sh
pnpm build
npm publish ./dist --tag latest --registry https://registry.npmjs.org/ --no-provenance
```

For provenance-enabled publishing, keep the `repository` metadata and
`publishConfig.provenance` values in `package.json` accurate.
