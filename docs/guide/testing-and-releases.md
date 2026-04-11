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
The release workflow reruns repository validation before versioning or publishing.

Read [`RELEASING.md`](https://github.com/selfagency/stately/blob/main/RELEASING.md) for the full maintainer flow.
