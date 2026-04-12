# Contributing to Stately

## Freshness note

Last reviewed: 2026-04-12

We welcome contributors. Stately is still young enough that a good
contribution can shape the product, and still opinionated enough that a little
alignment up front saves everyone a considerable number of unnecessary heroics later.

This guide is written for outside contributors. Internal maintainer workflows
may use extra tooling, but you do **not** need those tools to open a useful
issue or submit a solid pull request.

## Start with the right kind of contribution

Before you write code, decide which lane your change belongs in:

- **Docs fixes, examples, typo fixes, and small bug fixes** can usually start with a pull request.
- **Behavior changes, new plugins, public API changes, or larger features**
  should start with issue or maintainer alignment first so you do not spend a
  weekend building a feature nobody is prepared to merge.

If you are fixing an existing issue, link it in your pull request. If you are
proposing something new, open an issue first and describe the problem, the
proposed change, and any public API impact.

## Your first contribution

A worthy contribution follows a proper path. If this is your first, proceed in order:

1. Pick a scoped piece of work.
2. Confirm the work is wanted if it changes behavior or public API.
3. Set up the repo locally.
4. Make the smallest complete change that solves the problem.
5. Add or update tests when behavior changes.
6. Update docs when user-facing behavior changes.
7. Run the local validation commands.
8. Open a pull request with clear context.
9. Respond to review and keep the branch current.

That sequence is not glamorous, but neither is debugging a surprise API redesign in review.

## Set up local development

### Prerequisites

The repo currently gives you these verified environment facts:

- `pnpm` is pinned via `packageManager` to `pnpm@10.33.0`
- the project uses SvelteKit 2, Svelte 5, Vite 8, and Vitest

The repo does **not** currently declare a single required Node.js version in
`package.json` or a version file. Until it does, use a current maintained
Node.js release that is compatible with SvelteKit 2 and pnpm 10, and match your
team or CI version when in doubt.

### Install dependencies

```sh
pnpm install
```

### Run the app or docs locally

Use the app when you are working on runtime behavior:

```sh
pnpm run dev
```

Use the docs site when you are working on documentation:

```sh
pnpm run docs:dev
```

### Verify that your environment works

Run the fast local checks before you start making assumptions about the repo:

```sh
pnpm run check
pnpm run test
```

If those commands fail in a clean checkout, stop there and include the failure
details in an issue or draft PR instead of layering your own changes on top of
a broken setup.

## What maintainers expect in a pull request

### Keep the scope tight

Small, well-scoped pull requests review faster and break less. If a change
touches runtime behavior, docs, tests, and examples, that is fine. If it also
refactors unrelated code for fun, that is how you become folklore for the wrong
reason.

### Add tests for behavior changes

If you fix a bug or add a capability, add or update tests in the same change.

Stately is developed with a strong bias toward behavior-first verification:

- bug fixes should include regression coverage
- new public API behavior should include tests that describe the contract
- plugin changes should include observable integration coverage where practical

### Update docs with user-facing changes

If your change affects how users define stores, configure plugins, reason about
SSR, or consume a public export, update the relevant docs in the same pull
request.

### Preserve SSR safety

Stately is designed for SvelteKit and SSR-safe usage. Changes that introduce
shared mutable singleton state on the server, side effects in `load` functions,
or browser-only APIs in server paths are unlikely to survive review.

## Local validation commands

Run these before you open or update a pull request:

```sh
pnpm run check
pnpm run lint
pnpm run test
pnpm run build
```

These are the same high-value commands the repo uses for regular validation.

## Local hooks

The repo also runs local hooks to catch problems earlier:

- `pre-commit` runs `pnpm run validate:staged`
- `pre-push` runs `pnpm run validate:pre-push`

The pre-push hook runs:

- `pnpm run check`
- `pnpm run test`

That keeps common failures local before CI has to tell you what your machine already knew.

## Pull request checklist

Before you submit, make sure you can honestly check these off:

- [ ] The change solves a real issue or clearly improves the docs or developer experience.
- [ ] The scope is intentional and does not include unrelated refactoring.
- [ ] Tests were added or updated when behavior changed.
- [ ] Docs were updated when user-facing behavior changed.
- [ ] `pnpm run check`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` pass locally.
- [ ] The pull request description explains the problem, the solution, and any important trade-offs.

## Review and follow-up

Maintainers may ask for:

- smaller scope
- different API shape
- stronger test coverage
- documentation changes
- SSR-safety adjustments

That is normal review, not a declaration of war.

If your pull request changes direction during review, update the description so
the final PR tells the truth about what it now does.

## Release and maintainer-only workflows

External contributors do not need to manage releases. If your work changes
published behavior, include the code, tests, and docs. Maintainers handle the
release flow described in [`RELEASING.md`](./RELEASING.md) and the
[testing and releases guide](https://stately.self.agency/guide/testing-and-releases).

## Where to ask questions

If you are unsure whether a contribution is wanted, open an issue before you build it.

If you are already in a pull request, ask the question there with concrete context:

- what you are trying to change
- what behavior you expect
- what trade-off you are unsure about

Good questions are the mark of a distinguished contributor. Surprise rewrites are rather less so.
