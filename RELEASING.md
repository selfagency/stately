# Releasing Stately

This repository uses Changesets to manage npm versions and release pull requests.
The published npm artifact comes from `dist/`, not from the workspace root package manifest.

## Normal maintainer flow

1. Add or update a changeset with `pnpm changeset` while preparing a user-visible package change.
2. Merge the pull request into `main`.
3. Let `.github/workflows/release.yml` create or update the versioning pull request.
4. Review and merge that version pull request.
5. Let the same workflow rebuild the package, generate the release-only `dist/package.json`, copy `README.md`,
   `CHANGELOG.md`, `LICENSE.md`, and `stately.svg`, and publish `./dist` to npm.

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

The release workflow expects one of these setups:

- npm Trusted Publishing configured for this repository, with GitHub OIDC enabled
- `NPM_TOKEN` configured in repository secrets as a fallback

For provenance-enabled publishing, keep the `repository` metadata and `publishConfig.provenance` values in `package.json`
accurate.
