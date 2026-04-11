# Releasing Stately

This repository uses Changesets to manage npm versions and changelog entries.
The published npm artifact comes from `dist/`, not from the workspace root package manifest.

## Normal maintainer flow

1. Add or update a changeset with `pnpm changeset` while preparing a user-visible package change.
2. Merge the pull request into `main` and wait for the GitHub checks to pass.
3. Let Changesets update the version and changelog on `main`.
4. Create and push the release tag from the maintainer machine once the release commit is ready.
5. Run `pnpm release` locally to build `dist/` and publish `./dist` to npm.
6. Let `.github/workflows/release.yml` validate the tag, verify the tested
   `main` commit, and create the GitHub Release assets.

## Release package shape

The release build writes a minimal `dist/package.json` that keeps only consumer-facing metadata:

- package name and version
- description, keywords, homepage, bug tracker, and repository metadata
- runtime `dependencies` and `peerDependencies`
- ESM/Svelte entry points and export map
- provenance-aware `publishConfig`

It intentionally drops workspace-only fields such as dev dependencies, local scripts, and contributor tooling.
The release build also removes generated spec files and other test-only artifacts from `dist/` before publishing.

## Local dry run

Run the full release dry run locally before changing release automation:

```sh
pnpm install
pnpm release:dry-run
```

The dry run validates the package, builds the release-ready `dist/` output, writes the stripped release manifest, copies
the changelog and release assets, and performs an `npm publish --dry-run` against `./dist`.

## Publishing requirements

The local release command expects one of these setups:

- `npm login` already run on the maintainer machine
- `NPM_TOKEN` configured in the local shell or npm config as a fallback

The GitHub workflow does not publish to npm. It only validates the tagged
release, rebuilds the package, and creates the GitHub Release artifacts.

For provenance-enabled publishing, keep the `repository` metadata and
`publishConfig.provenance` values in `package.json` accurate.
