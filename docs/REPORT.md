# Project report: Neighborhood Housing Tool with a DevOps pipeline

KTH DD2482 · Hossein Ghadirzadeh, Nalin Kundu · Repository:
[https://github.com/hosseinghzadeh/neighborhood-housing-tool](https://github.com/hosseinghzadeh/neighborhood-housing-tool)

> DRAFT: items marked **[CONFIRM]** depend on repository settings or facts only
> the team can verify. Remove this note and the markers before submitting.

## 1. What we built

The product is a small web application that helps people who are new to a city
choose a neighbourhood. A user describes their household, budget and priorities
in plain language; the app extracts a structured profile and ranks areas on
safety, schools, education level, commute and affordability, showing the
reasons behind each score on a map. The data is seeded demo data for the
Stockholm region; the focus of the project is the delivery pipeline around it,
not the data.

The app is a TanStack Start (React, TypeScript) application. The scoring is
deterministic and unit-tested; an optional language model is used only to turn
free text into a structured profile and never to rank areas.

## 2. Architecture and processes


| Concern              | Implementation                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Platform             | GitHub: pull requests, `CODEOWNERS`, branch protection ruleset **[CONFIRM]**              |
| CI                   | GitHub Actions: lint, type check, unit tests and production build in parallel on every PR |
| IaC                  | Terraform (`infra/`) with the Docker provider                                             |
| CD                   | GitHub Actions publishes the container image to GHCR on every merge to `main`             |
| Database             | Postgres container, private network and volume in the same Terraform module               |
| Quality and security | CodeQL (PRs and weekly), Dependabot (npm/Bun, Actions, Docker, Terraform)                 |
| AI documentation     | `docs/AI_USAGE.md`                                                                        |


The flow is: a developer opens a pull request from a branch; four CI checks, the
`infra` job and CodeQL run; another team member reviews; after a squash merge to
`main`, the `publish` job builds the image from the same `Dockerfile` and pushes
it to the GitHub Container Registry tagged `latest` and with the commit SHA.

**How the components interact.** The `infra` job is where the pieces meet:
Terraform builds the image from the repository's `Dockerfile`, starts a
Postgres container and the app container on a shared private network, and
passes the app a `DATABASE_URL`. The job then calls `GET /api/health`, which
only returns 200 when the app can query the database, as a smoke test before
destroying everything. The same Dockerfile is used by the `publish` job, so what
is verified on a pull request is what is delivered after the merge. The
Dockerfile builds the app as a plain Node server (Nitro `node-server` preset)
instead of the default Cloudflare Workers target, which keeps the container
independent of any cloud account.

## 3. Key design decisions

- **One workflow, matrix for the checks.** The four checks share one job
definition and appear as separate status checks, so branch protection can
require each individually without duplicating setup steps.
- **Terraform runs on every pull request, not only on release.** Provisioning
the real container on each PR verifies the Dockerfile, the Terraform and the
production server together. This catches the failures that only appear when
the system is actually started, which unit tests cannot.
- **Docker provider instead of a cloud provider.** It needs no account or
secrets, so anyone (including a grader) can reproduce `terraform apply`
locally. The trade-off is that nothing is hosted permanently (see
limitations).
- **The database is provisioned by the same Terraform module.** Postgres runs
as a second container next to the app, so `terraform apply` brings up the
whole system and the CI smoke test exercises the app, the database and the
network between them. Postgres publishes no host port (only the app can
reach it, by container name), and its data lives in a named volume so it
survives container re-creation.
- **The database stores user data, not the area data.** It holds saved
searches (a household profile in a `jsonb` column). The seeded area data
stays in code behind the `AreaRepository` interface, because it is static and
versioned with the scoring logic. The database is optional: without
`DATABASE_URL` the app still works and only saved searches are unavailable.
- **No stored secret for CI.** The `infra` job generates a random, masked
database password for each run and destroys the stack at the end, so the
repository needs no database secret. The Terraform variable is marked
`sensitive` and must be at least 12 characters.
- **Publish only after everything else passes.** `publish` depends on the CI
and `infra` jobs and only runs on `main`, with `packages: write` granted to
that single job; all other jobs have read-only permissions.
- **Security automation in the same pipeline.** CodeQL covers code
vulnerabilities; Dependabot covers outdated or vulnerable dependencies,
GitHub Actions versions, base images and Terraform providers.
- **Deterministic core, optional AI.** Keeping the ranking logic outside the
language model makes it testable and keeps the app fully usable without any
AI configuration. Model output is sanitised before use.



## 4. How AI tools were used

The initial application was generated with Lovable. Migration of that export,
the tests, the pipeline, the Terraform module, the Dockerfile and a first draft
of this report were produced with Claude Code and reviewed by the team. The
full dated log is in `[docs/AI_USAGE.md](AI_USAGE.md)`. **[CONFIRM and add any
other AI use, including AI-assisted code review.]**

## 5. Limitations and trade-offs

- **No persistent hosting.** The pipeline proves the system can be provisioned,
run and verified from code, and delivers the image, but no long-running
environment is deployed. A remote Docker host (the provider can use
`ssh://`) or a managed platform would be the next step and would reuse the
same module.
- **Terraform state is local.** That is acceptable because the CI environment
is ephemeral, but it would not work for a shared environment, which needs a
remote, locked backend.
- **Saved searches are visible to everyone.** There is no login, so every
visitor sees the 20 most recent saved searches from all users. That is fine
for demo data, but real use would need user accounts and per-user queries
before anyone stores personal information.
- **The database password ends up in the Terraform state.** `sensitive` only
hides the value in Terraform's output; the state file still stores it in
plain text (as the variable, in the Postgres container's environment and in
the app's `DATABASE_URL`). In CI the state and the password are thrown away
after each run, but a shared environment would need an encrypted remote
backend and the password in a secret manager.
- **Demo data.** The rankings are only as good as the seeded data; real sources
(statistics, schools, crime, transport) are not integrated.
- **Small test surface.** Unit tests cover the scoring engine and the request
parser; the UI has no automated tests.
- **Team review.** Required reviews work best with two active reviewers.




## 6. Contributions

**Nalin Kundu**

- Planned and implemented the database (PR #9): the Postgres container,
private network, volume and password variable in Terraform; the
`DATABASE_URL` wiring and the `postgres` client in the app; the
saved-searches feature with its unit tests; the `GET /api/health` endpoint;
and the database check and per-run password in the CI `infra` job.
- Updated the README and `docs/AI_USAGE.md` for the database, and updated this report and general documentation with related work and such
- Reviewed and approved the CD and IaC pull request (PR #7).

**Hossein Ghadirzadeh**

