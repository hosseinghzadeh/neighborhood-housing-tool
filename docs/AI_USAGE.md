# AI usage log

This project is a KTH DD2482 (DevOps) course project. The course requires us to
document clearly how AI-assisted tools were used. This file is a living log:
add a row whenever AI tooling contributes to the repository.

## Two different kinds of AI in this project

1. **AI used to build the project** (documented in the table below).
2. **AI inside the product**: the free-text request box turns a household
   description into a structured profile through an OpenAI-compatible API
   (`src/lib/areafit-ai.functions.ts`). It is optional and disabled unless
   `AI_API_KEY`, `AI_API_BASE_URL` and `AI_MODEL` are set. Rankings are never
   produced by the model; a deterministic scoring engine
   (`src/services/recommendation-engine.ts`) computes them, and everything the
   model returns is sanitised (`sanitisePatch`) before use.

## Log of AI-assisted development work

| Date             | Who     | Tool                     | What it was used for                                                                                                                                                                                                                                                                                          | How it was checked                                                                                                                                                                                                                                                                              |
| ---------------- | ------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| up to 2026-09-27 | Hossein | Lovable (AI app builder) | Generated the initial application (UI, scoring engine, demo data) from natural-language prompts. This is the AI-built origin of the concept.                                                                                                                                                                  | Exported the code and reviewed it before adopting it.                                                                                                                                                                                                                                           |
| 2026-09-27       | Hossein | Claude Code (Anthropic)  | Migrated the Lovable export into this repository: removed Lovable-specific files and hooks, made the AI endpoint provider-agnostic, fixed lint and TypeScript errors, renamed the branding.                                                                                                                   | Ran `eslint`, `tsc --noEmit`, the production build and the dev server.                                                                                                                                                                                                                          |
| 2026-10-04       | Hossein | Claude Code (Anthropic)  | Added the unit tests (Vitest), the CI and CodeQL workflows, the Dependabot configuration, and these docs.                                                                                                                                                                                                     | Ran lint, typecheck, tests and build locally; changes go through a pull request that the other team member reviews.                                                                                                                                                                             |
| 2026-10-09       | Hossein | Claude Code (Anthropic)  | Wrote the Dockerfile, the Terraform module in `infra/`, the `infra` and `publish` jobs in the CI workflow, the Dependabot entries for Docker and Terraform, the README pipeline section and a first draft of the report.                                                                                      | Validated the Terraform with `terraform fmt` and `terraform validate`, ran the equivalent of the container build and start by hand (Node server build, HTTP check), reviewed everything before committing; the first full run of the container build is the CI `infra` job on the pull request. |
| 2026-10-09       | Nalin   | Claude Code (Anthropic)  | Planned and implemented the database: Postgres container, network, volume and password variable in Terraform; `DATABASE_URL` wiring, the saved-searches feature, `GET /api/health` and the `summariseProfile` tests; the health check and per-run database password in the CI `infra` job; the README update. | Ran lint, typecheck, tests and build locally; reviewed the diff before committing. On PR #9 all CI checks passed, including the `infra` job that provisions the app and the database and checks `/api/health`; Hossein reviewed and approved it.                                                |
| 2026-10-09       | Nalin   | Claude Code (Anthropic)  | Updated `docs/REPORT.md` for the database (architecture table, design decisions, limitations) and drafted Nalin's part of the Contributions section.                                                                                                                                                          | Checked every statement against the code and PR #9 before committing.                                                                                                                                                                                                                           |

## TODO (to be filled in by the team)

- [ ] Nalin: add rows for any AI tool you use (code, Terraform, review, writing).
- [ ] Record any AI-assisted code review used on pull requests.
- [ ] Note which parts of the final report were drafted or edited with AI.
