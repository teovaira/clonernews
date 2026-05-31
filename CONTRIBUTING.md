# Contributing

This document describes how the CloneHN team works. Follow it for every change.

## Workflow rules

1. **Stay in your lane.** Each member owns a defined set of files (see
   `ROADMAP.md`). Don't edit another member's files; if a shared contract needs
   to change, both owners must agree first.
2. **TDD always.** Write the test first, watch it fail, then write the
   implementation. One function at a time.
3. **Conventional commits.** Every commit message starts with a type:
   `feat:`, `fix:`, `test:`, `docs:`, or `chore:`. Keep commits small and
   focused — one logical change each.
4. **`npm test` must pass before every push.** No exceptions.
5. **Never let a test hit the real network.** Mock `client.get` (or global
   `fetch`) in any test that transitively imports `src/api/`. Use
   `vi.mock('../api/client.js')` (or an inline factory).

## Getting set up

```bash
git clone https://platform.zone01.gr/git/ckotsalas/clonernews.git
cd clonernews
npm install
npm test          # confirm a clean baseline before you start
```

## Development loop

```bash
npm run test:watch   # keep tests running while you work
npm run dev          # run the app in the browser
```

A typical change:

1. Add or extend a test for the single function you're working on.
2. Run the test, confirm it fails for the right reason.
3. Implement the function until the test passes.
4. Commit the test and the implementation as separate conventional commits.
5. Run the full `npm test` suite, then push.

## Commit message examples

```
test: add getPollOptions sort-by-score test
feat: add getPollOptions to fetch and rank poll options
fix: handle undefined score on job cards
docs: document the live-update banner contract
```

## Code conventions

- **ES modules** throughout; no UI framework.
- **Comments explain the _why_, not the _what_.** Skip comments that just
  restate the code.
- **Accessibility and responsiveness are requirements**, not extras: semantic
  markup, ARIA where needed, keyboard support, visible focus, and layouts that
  work from phone to desktop.
- Keep functions small and single-purpose; match the style of the surrounding
  code.

## Branch & release

- Work is pushed directly to `main` with a passing test suite.
- Releases are tagged from `main`; the `CHANGELOG.md` `Unreleased` section is
  promoted to a dated version at release time.
