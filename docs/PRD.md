# DevForge Product Requirements Document

## 1. Product vision

DevForge is a trusted, decentralized freelance marketplace where clients hire technical talent, developers deliver work, and milestone payments are secured through blockchain escrow. AI assists with drafting and matching, but never replaces user judgment or financial authorization.

The product should feel as polished and dependable as a modern SaaS platform while making payment custody and delivery status verifiable.

## 2. Problem statement

Freelance platforms centralize trust, payments, and dispute decisions. Clients worry about paying before delivery; freelancers worry about completing work without being paid. Discovery and proposal writing are time-consuming, and portfolios are difficult to compare consistently. DevForge reduces these frictions with structured hiring workflows, clear milestones, realtime collaboration, and transparent escrow.

## 3. Goals

- Enable a client to discover, evaluate, hire, and collaborate with a freelancer.
- Enable a freelancer to present credible skills and submit tailored proposals.
- Protect agreed milestone funds using non-custodial smart-contract escrow.
- Provide secure messaging, files, notifications, and delivery history.
- Use AI to improve drafting and matching with explicit user control.
- Operate as an auditable, accessible, responsive SaaS product.

## 4. Target audience

- Small and mid-sized technology companies hiring contract engineers or designers.
- Independent developers and Web3 specialists seeking project work.
- Startup founders who need milestone-based delivery and transparent payment status.
- Platform administrators responsible for safety, moderation, support, and operations.

## 5. Personas

### Freelancer — Maya, independent full-stack engineer

Maya needs a credible public profile, relevant job discovery, low-friction proposals, protected payment, and a single place to manage active work and earnings. She values clear requirements and predictable milestone release.

### Client — Arjun, startup CTO

Arjun needs to publish a well-scoped job, compare applicants, validate delivery, and release payment only after approval. He wants project visibility without learning blockchain implementation details.

### Administrator — Elena, trust and safety operator

Elena needs to investigate reports, moderate content, administer categories and roles, view financial/audit events, and act only through accountable workflows.

### Guest — Sam, prospective user

Sam needs to browse public jobs and freelancer profiles, understand the product, and register when an action requires an account.

## 6. User stories

- As a guest, I can browse public jobs, categories, and approved freelancer profiles.
- As a user, I can register with email/password or Google, verify my email, reset my password, and link a wallet after proving wallet ownership.
- As a freelancer, I can create a profile, add skills and portfolio evidence, set availability, and submit, edit, or withdraw a proposal while the job is open.
- As a client, I can create, publish, edit, close, and archive my jobs; review proposals; and hire one freelancer.
- As a project member, I can exchange messages and approved file attachments in a project conversation.
- As a client, I can fund an approved milestone and release funds after accepting delivery.
- As a freelancer, I can see each milestone's escrow and payment status without relying on an administrator.
- As either party, I can submit a review only after an eligible completed project.
- As an administrator, I can review reports and audit actions without silently changing financial history.
- As an eligible user, I can ask AI to draft a job description or proposal and edit the result before use.

## 7. Functional requirements

### Identity and access

- Email/password, Google OAuth, verification, password reset, session management, and wallet linking.
- Roles: `GUEST`, `FREELANCER`, `CLIENT`, `ADMIN`; one user may hold both marketplace roles.
- Resource-level authorization for every private record and action.

### Profiles and discovery

- Freelancer profiles support biography, skills, experience, certifications, portfolio, rate guidance, location/timezone, and availability.
- Client profiles support organization identity and public company information.
- Jobs support category, skills, engagement type, budget, currency, visibility, lifecycle status, and search filters.

### Hiring and project delivery

- Proposal creation, withdrawal, acceptance, rejection, and immutable status history.
- Acceptance creates one project contract with one or more milestones.
- Project participants may communicate, attach files, submit deliveries, approve work, and open a dispute under defined rules.

### Payments and escrow

- The application records intended payment state; confirmed blockchain events determine escrow settlement state.
- Escrow supports funding, release, refund, and dispute states. The platform never stores customer private keys.
- Users can inspect transaction references and confirmation status.

### Platform features

- In-app and email notifications with preferences.
- Realtime messaging, read receipts, typing/presence signals, and secure attachment metadata.
- Reviews, reports, moderation, administrator workflows, and auditable privileged actions.
- AI drafting/matching requests with quotas, provenance, and user-controlled publication.

## 8. Non-functional requirements

- Type-safe TypeScript boundaries; Zod validation at all external inputs.
- WCAG 2.2 AA-oriented responsive UI, keyboard navigation, semantic markup, and dark mode.
- P95 API target under 500 ms for ordinary read requests excluding third-party calls; cursor pagination for high-volume feeds.
- Strong tenant/resource isolation, least privilege, rate limiting, secure cookies, CSP, and immutable audit events.
- Idempotent processing for webhooks, queues, and blockchain logs.
- Structured logging with correlation IDs; actionable alerts for failed jobs, escrow reconciliation, and security anomalies.
- Automated unit, integration, end-to-end, contract, and smart-contract testing before production release.

## 9. MVP scope

The MVP validates the core marketplace and guarded escrow flow:

1. Account lifecycle: email/password, Google OAuth, verified email, profile onboarding, and wallet linking.
2. Freelancer and client profiles, skills, portfolio, categories, and public discovery.
3. Job creation/search/detail, proposal lifecycle, hiring, projects, and milestones.
4. One private project conversation with attachments and notifications.
5. Testnet ERC-20 milestone escrow with funding, release, event indexing, and transaction visibility.
6. Basic post-completion reviews and administrator report review.
7. AI job/proposal drafting with explicit review before saving.

## 10. Future features

- Multi-party organizations, team roles, agency accounts, and enterprise SSO.
- Native invoices, tax documents, fiat on-ramp/off-ramp integrations, and multi-chain support.
- Escrow arbitration panels, reputation portability, and decentralized identity integrations.
- Video calls, collaborative project workspaces, code repository integrations, and advanced analytics.
- AI resume review, richer skill matching, evaluation datasets, and personalized recommendations.

## 11. Success metrics

- Activation: verified users completing a role profile within seven days.
- Marketplace liquidity: job-to-proposal rate, median time to first proposal, and hire rate.
- Delivery: funded-project completion rate, milestone approval time, and dispute rate.
- Trust: escrow event reconciliation success, fraud/report resolution time, and review completion rate.
- Engagement: weekly active project participants and message response time.
- Quality: API error rate, P95 latency, accessibility defects, and release rollback rate.

## 12. Out of scope for MVP

- Custodial wallets or storage of private keys.
- Fiat settlement, tax calculation, legal arbitration, and guaranteed insurance.
- Native mobile applications.
- Full enterprise organization management and SSO.
- Autonomous AI hiring, automatic payment release, or AI-generated content published without user review.

## 13. Risks and mitigations

| Risk                                        | Mitigation                                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Smart-contract flaw or chain reorganization | Small audited contract surface, testnet first, confirmation thresholds, pause controls, idempotent indexer. |
| Regulatory or jurisdictional uncertainty    | Clear product terms, legal review before mainnet/fiat expansion, no custody.                                |
| Marketplace cold start                      | Seed supply/demand in a narrow technical niche and measure liquidity before expansion.                      |
| Spam, fraud, or abusive content             | Email verification, rate limits, reports, moderation, reputation signals, audit logs.                       |
| AI hallucination or sensitive-data leakage  | Human review, redaction guidance, provider controls, output labeling, quotas.                               |
| Realtime service failure                    | Persist messages before broadcast, reconnect/resync, Redis-backed fan-out, monitoring.                      |

## 14. Assumptions

- The initial launch targets an EVM-compatible testnet and stablecoin-denominated milestone amounts.
- Users are responsible for their own wallet keys and gas fees unless a later product decision changes that model.
- English is the initial product language; all product copy remains localization-ready.
- PostgreSQL is the system of record for application data; the blockchain is authoritative for on-chain settlement events.
- A verified account may operate as both freelancer and client, but a project has distinct client and freelancer parties.
