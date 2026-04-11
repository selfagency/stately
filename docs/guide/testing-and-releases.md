# Testing and releases

The repository validates the library with the same commands used in CI and release review.
Run them locally before opening a pull request or changing release automation.

## Validation commands

```sh
pnpm run check
pnpm run lint
pnpm run test
pnpm run build
```

## Local contributor hooks

- `pre-commit` runs `pnpm run validate:staged`
- `pre-push` runs `pnpm run validate:pre-push`

That keeps staged-file feedback fast while still running Svelte checks and the test suite before code leaves your machine.

## Release flow

Stately uses Changesets for npm versioning and release pull requests.
The GitHub release workflow reruns repository validation on the tagged commit,
then prepares the GitHub Release assets. It does not publish to npm.

Publishing happens locally from the maintainer machine after the release commit
has landed on `main` and the GitHub checks have passed.

That release build:

- writes a stripped `dist/package.json`
- copies `README.md`, `CHANGELOG.md`, `LICENSE.md`, and `stately.svg`
- removes generated test-only files from `dist/`
- publishes `./dist` from the local release command with provenance-aware npm settings

Read [`RELEASING.md`](https://github.com/selfagency/stately/blob/main/RELEASING.md) for the full maintainer flow.
