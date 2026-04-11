# Releasing Stately

This repository uses Changesets to manage npm versions and release pull requests.

## Normal maintainer flow

1. Add or update a changeset with `pnpm changeset` while preparing a user-visible package change.
2. Merge the pull request into `main`.
3. Let `.github/workflows/release.yml` create or update the versioning pull request.
4. Review and merge that version pull request.
5. Let the same workflow publish to npm after validation passes and publishing credentials are available.

## Local dry run

Run the full release dry run locally before changing release automation:

```sh
pnpm install
pnpm release:dry-run
```

The dry run validates the package, builds the distributable output, and prints the current Changesets status.

## Publishing requirements

The release workflow expects one of these setups:

- npm Trusted Publishing configured for this repository, with GitHub OIDC enabled
- `NPM_TOKEN` configured in repository secrets as a fallback

For provenance-enabled publishing, keep the `repository` metadata and `publishConfig.provenance` values in `package.json` accurate.
