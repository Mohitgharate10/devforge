# DevForge Delivery Roadmap

## Delivery principles

Each sprint ends with a working, testable vertical slice and a releasable branch. Estimates are relative complexity, not calendar promises. Scope may move based on evidence, but security, testing, documentation, and observability are part of every sprint—not deferred cleanup.

## Sprint 1 — Project foundation

- **Goal:** Establish a repeatable, secure engineering baseline.
- **Features:** pnpm workspace; Next.js app shell; shared TypeScript/lint/format config; Docker local PostgreSQL/Redis; environment validation; CI; health checks; error envelope; structured logging; test harness.
- **Files affected:** root workspace/config files; `apps/web`; `packages/config`, `packages/observability`, `packages/api-contracts`; `docker`; `.github/workflows`; `docs`.
- **Complexity:** Medium.
- **Dependencies:** Node LTS, pnpm, Docker, CI provider.
- **Learning outcomes:** Monorepo boundaries, configuration hygiene, local infrastructure, quality gates.
- **Commit milestones:** `chore: initialize workspace`; `build: add local services`; `ci: enforce quality gates`; `docs: define engineering conventions`.

## Sprint 2 — Authentication and access control

- **Goal:** Deliver secure account lifecycle and policy foundation.
- **Features:** Better Auth, email/password, Google OAuth, verification/reset, roles, session security, CSRF/rate limiting, SIWE wallet linking, authorization policies.
- **Files affected:** `apps/web` identity module/routes; `packages/database`; `packages/domain`; `packages/api-contracts`; auth tests and environment docs.
- **Complexity:** High.
- **Dependencies:** Sprint 1; Google OAuth credentials; email provider; authentication secret management.
- **Learning outcomes:** Session security, OAuth, wallet signatures, RBAC plus resource authorization.
- **Commit milestones:** `feat(auth): add session lifecycle`; `feat(auth): add Google OAuth`; `feat(wallet): add SIWE linking`; `test(auth): cover security boundaries`.

## Sprint 3 — Profiles and taxonomy

- **Goal:** Enable trustworthy identity and marketplace categorization.
- **Features:** Freelancer/client onboarding, profile visibility, skills, portfolio metadata, experiences, certifications, job categories, secure upload foundation.
- **Files affected:** profile/taxonomy modules, storage adapter, database migrations, profile pages, unit/integration tests.
- **Complexity:** Medium.
- **Dependencies:** Sprint 2; object storage credentials and content scanning approach.
- **Learning outcomes:** Profile domain modeling, authorization by ownership, private asset flows.
- **Commit milestones:** `feat(profiles): add freelancer profile`; `feat(profiles): add client profile`; `feat(taxonomy): add categories and skills`; `feat(storage): add secure uploads`.

## Sprint 4 — Job marketplace

- **Goal:** Allow clients to publish work and freelancers to discover it.
- **Features:** Job draft/publish/pause/close lifecycle, categories/skills, full-text search, filters, cursor pagination, saved jobs, public job pages.
- **Files affected:** jobs module/routes/pages, search database indexes, API contracts, marketplace tests.
- **Complexity:** High.
- **Dependencies:** Sprint 3; database search strategy.
- **Learning outcomes:** Search/index design, lifecycle state machines, scalable pagination.
- **Commit milestones:** `feat(jobs): add drafts`; `feat(jobs): publish lifecycle`; `feat(search): add discovery filters`; `test(jobs): verify authorization and transitions`.

## Sprint 5 — Proposals, hiring, and projects

- **Goal:** Convert a job into a governed client-freelancer engagement.
- **Features:** Proposal submission/edit/withdrawal, client review/accept/reject, transactional contract creation, milestones, deliveries, approval, disputes skeleton.
- **Files affected:** proposals/projects modules; transaction/repository layer; dashboard pages; API tests.
- **Complexity:** High.
- **Dependencies:** Sprint 4; finalized project and milestone policy.
- **Learning outcomes:** Transactional workflows, optimistic concurrency, state machine testing.
- **Commit milestones:** `feat(proposals): submit and manage`; `feat(hiring): accept proposal transactionally`; `feat(projects): add milestones and deliveries`; `test(projects): enforce lifecycle rules`.

## Sprint 6 — Realtime chat and notifications

- **Goal:** Make active projects collaborative and responsive.
- **Features:** Socket.IO gateway, authenticated rooms, persisted messages, attachments, read cursor, typing/presence, in-app/email notification queue/preferences.
- **Files affected:** `apps/realtime`, `apps/worker`, messaging/notification modules, Redis config, deployment manifests, E2E tests.
- **Complexity:** High.
- **Dependencies:** Sprint 5; Redis; email provider; object storage scanning.
- **Learning outcomes:** Durable vs ephemeral state, distributed pub/sub, worker retries, reconnect/resync.
- **Commit milestones:** `feat(realtime): establish authenticated gateway`; `feat(messages): persist project chat`; `feat(notifications): add worker delivery`; `test(realtime): cover reconnect and access`.

## Sprint 7 — Blockchain escrow

- **Goal:** Secure milestone payment on an EVM testnet.
- **Features:** Minimal escrow contract, Hardhat tests, deployment scripts, ABI integration, funding/release intents, event indexer, confirmation/reconciliation workflow, transaction status UI.
- **Files affected:** `packages/contracts`; worker escrow queues; escrow module; database migrations; wallet UI; security/runbook docs.
- **Complexity:** Very high.
- **Dependencies:** Sprint 5; wallet linking; EVM RPC provider; testnet stablecoin/test token; independent security review plan.
- **Learning outcomes:** Smart-contract security, event-sourced reconciliation, non-custodial UX, idempotency.
- **Commit milestones:** `feat(contracts): implement escrow state machine`; `test(contracts): cover adversarial cases`; `feat(escrow): index confirmed events`; `feat(escrow): add funding and release flow`; `docs(security): add escrow runbook`.

## Sprint 8 — AI assistance

- **Goal:** Add safe, useful drafting and matching assistance.
- **Features:** Asynchronous AI request queue, job/proposal drafts, resume review, skill-match explanation, quotas, provider adapter, output provenance, evaluations and cost telemetry.
- **Files affected:** AI module, worker consumers, provider adapter, API contracts, UI review flows, evaluation fixtures.
- **Complexity:** High.
- **Dependencies:** Sprints 3–5; AI provider and data-handling policy.
- **Learning outcomes:** Structured generation, async orchestration, safety controls, evaluation-driven prompts.
- **Commit milestones:** `feat(ai): add request orchestration`; `feat(ai): add job and proposal drafts`; `feat(ai): add resume review`; `test(ai): add output contract evaluations`.

## Sprint 9 — Trust, administration, and analytics

- **Goal:** Give operators safe tools to run the marketplace.
- **Features:** Reviews, reporting, moderation queue, account controls, taxonomy management, audit-log explorer, operational dashboards, core product analytics.
- **Files affected:** admin/reviews/reports modules and pages; audit service; reporting queries; admin authorization tests.
- **Complexity:** High.
- **Dependencies:** Sprints 4–7; privacy/retention policy.
- **Learning outcomes:** Moderation workflow design, accountable admin actions, analytical data modeling.
- **Commit milestones:** `feat(reviews): add eligibility and ratings`; `feat(moderation): add reports`; `feat(admin): add audited actions`; `feat(analytics): add operational metrics`.

## Sprint 10 — Quality, security, and deployment readiness

- **Goal:** Produce a monitored, deployable release candidate.
- **Features:** Full test matrix, accessibility audit, performance/load testing, dependency/security scans, backup/restore test, production infrastructure, release workflow, dashboards, alerting, incident and migration runbooks.
- **Files affected:** all test suites; Docker/deployment configuration; CI/CD workflows; observability packages; runbook documentation.
- **Complexity:** Very high.
- **Dependencies:** Functional scope complete; production accounts/secrets; security review.
- **Learning outcomes:** Operational readiness, release engineering, incident response, capacity planning.
- **Commit milestones:** `test: complete end-to-end critical paths`; `chore(security): add scans and headers`; `ops: add production monitoring`; `docs: add release and incident runbooks`; `release: prepare candidate`.

## Definition of done for every sprint

- Product and API behavior documented and accepted.
- Input validation, authorization, error mapping, and audit implications reviewed.
- Unit and integration tests cover changed domain behavior; E2E tests cover changed critical flows when applicable.
- Lint, typecheck, build, and relevant tests pass in CI.
- Database migrations are reversible or have a tested operational rollback/forward plan.
- Observability events and user-facing loading/error states are included.
- No unrelated refactors or dependency upgrades are bundled with feature work.
