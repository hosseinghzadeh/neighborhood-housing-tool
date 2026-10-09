# Contributing

We are two people, so the process is deliberately small but strict.

## Workflow

1. Never push to `main`. Create a branch (`feat/...`, `fix/...`, `ci/...`, `infra/...`).
2. Open a pull request using the template.
3. The other team member reviews it (see `.github/CODEOWNERS`). Authors do not
   approve their own PRs.
4. Merge only when all required checks are green:
   `ci (lint)`, `ci (typecheck)`, `ci (test)`, `ci (build)` and CodeQL.
5. Squash-merge, then delete the branch.

## Branch protection (repository settings)

Configured as a ruleset on `main`:

- Require a pull request before merging, with 1 approval and code-owner review
- Require status checks to pass: the four `ci (...)` jobs
- Block force pushes and branch deletion
- No bypass for administrators

## Running the checks locally

```sh
bun install
bun run lint
bun run typecheck
bun run test
bun run build
```

## AI assistance

Record any AI contribution in [`docs/AI_USAGE.md`](docs/AI_USAGE.md).
