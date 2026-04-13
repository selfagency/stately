# Testing and releases

The repository holds itself to a proper standard: the same validation commands used in CI and
release review are available to you locally.
Run them before opening a pull request or changing release automation.

## Validation commands

```sh
pnpm run check
pnpm run lint
pnpm run test
pnpm run build
```

## Type-level tests

The test suite includes a dedicated `types.test-d.ts` file that uses Vitest's
`expectTypeOf` API to verify compile-time type inference. These tests run
automatically as part of `pnpm run test` through the `typechecking` Vitest
project and cover:

- Option and setup store type flow (`$state`, `$patch`, `$subscribe`, `$onAction`)
- Setup store `$state`/`$patch` excluding action functions
- `storeToRefs` filtering and ref wrapping
- Plugin augmentation properties (`$persist`, `$history`, `$timeTravel`, `$async`, `$fsm`)
- Compile-time rejection of non-plain option store state shapes

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
