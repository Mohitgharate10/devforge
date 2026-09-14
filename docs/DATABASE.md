# DevForge Database Design

## 1. Design rules

- PostgreSQL is the application system of record; on-chain events are authoritative only for blockchain settlement.
- Use UUID primary keys, `created_at`, `updated_at`, and UTC timestamps on mutable tables.
- Store monetary values as integer minor units plus ISO currency, never floating point.
- Use enums/check constraints for state machines; do not infer business state from nullable timestamps.
- Apply soft deletion only to user-facing recoverable records. Financial, escrow, and audit records are immutable/retained.
- Every foreign key has an explicit deletion policy.

## 2. ER diagram

```text
users ──< accounts, sessions, wallets, notifications, audit_logs, reports
  ├── 1:1 freelancer_profiles ──< freelancer_skills, portfolio_projects, experiences, certifications
  └── 1:1 client_profiles ──< jobs

job_categories ──< jobs ──< job_skills >── skills
jobs ──< proposals >── freelancer_profiles
proposals ── 0..1 contracts ──< milestones ──< deliveries
contracts ── 1:1 escrows ──< escrow_transactions
contracts ──< contract_participants >── users
contracts ──< conversations ──< messages ──< message_attachments
contracts ──< reviews
contracts ──< invoices ──< payments
users ──< reports; users ──< audit_logs
```

## 3. Identity and authorization tables

| Table                 | Description                                                               | Key constraints and indexes                                                                              |
| --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `users`               | Canonical human account: email, display name, status, verification state. | Unique case-normalized email; index on status and created time.                                          |
| `accounts`            | OAuth/provider identities managed by auth provider.                       | Unique `(provider_id, provider_account_id)`; FK `user_id` cascade delete.                                |
| `sessions`            | Revocable authenticated sessions.                                         | Unique session token hash; index `(user_id, expires_at)`; expired sessions purged by job.                |
| `verification_tokens` | Hashed, expiring one-time email/reset/action tokens.                      | Unique token hash; index expiry; never store raw token.                                                  |
| `roles`               | Named platform roles: freelancer, client, admin.                          | Unique role name.                                                                                        |
| `permissions`         | Atomic administrative/application permissions.                            | Unique permission key.                                                                                   |
| `role_permissions`    | Role-to-permission join.                                                  | Composite primary key `(role_id, permission_id)`.                                                        |
| `user_roles`          | User role assignment.                                                     | Composite unique `(user_id, role_id)`; record grantor and timestamp.                                     |
| `wallets`             | Verified wallet links and chain metadata.                                 | Unique normalized `(chain_id, address)`; one primary wallet per user per chain via partial unique index. |
| `wallet_nonces`       | Short-lived SIWE challenges.                                              | Unique nonce hash; check unused and unexpired; indexed expiry.                                           |

`users` may have both freelancer and client roles. `ADMIN` assignment is privileged, must be audited, and cannot be inferred from a profile.

## 4. Profile and taxonomy tables

| Table                 | Description                             | Relationships / constraints                                                      |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| `freelancer_profiles` | Professional public/private profile.    | Unique `user_id`; unique normalized handle; FK user restrict; availability enum. |
| `client_profiles`     | Client organization/person profile.     | Unique `user_id`; optional unique organization slug.                             |
| `skills`              | Curated skill taxonomy.                 | Unique normalized slug; `is_active` governs selectable skills.                   |
| `freelancer_skills`   | Skill proficiency and display ordering. | Unique `(freelancer_profile_id, skill_id)`; proficiency bounded enum/score.      |
| `portfolio_projects`  | Freelancer portfolio entries.           | FK profile cascade; public/published state; display-order index.                 |
| `experiences`         | Work history.                           | FK profile cascade; date range check.                                            |
| `certifications`      | Professional certifications.            | FK profile cascade; expiration not earlier than issuance.                        |
| `job_categories`      | Hierarchical curated category taxonomy. | Unique slug; nullable self-FK parent; prevent cycles in application logic.       |

Public profile visibility is explicit. Uploaded resume assets are represented in an attachment/asset record and remain private unless published.

## 5. Marketplace tables

| Table                     | Description                        | Relationships / constraints                                                                                |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `jobs`                    | Client job listing.                | FK client profile and category restrict; budget min/max check; lifecycle enum; searchable published index. |
| `job_skills`              | Required/preferred job skills.     | Unique `(job_id, skill_id)`; requirement level enum.                                                       |
| `saved_jobs`              | Freelancer bookmarks.              | Unique `(user_id, job_id)`; both FKs cascade.                                                              |
| `proposals`               | Freelancer offer for one job.      | Unique `(job_id, freelancer_profile_id)`; fee > 0; status enum; FK job restrict.                           |
| `proposal_status_history` | Immutable proposal transition log. | FK proposal restrict; stores prior/new status, actor, reason.                                              |

Jobs use `DRAFT`, `PUBLISHED`, `PAUSED`, `CLOSED`, and `ARCHIVED` states. Proposals use `SUBMITTED`, `WITHDRAWN`, `ACCEPTED`, `REJECTED`, and `EXPIRED`; database/application transition policy prevents invalid changes.

Indexes: `(status, category_id, published_at DESC)`, `(client_profile_id, status, updated_at DESC)`, full-text search over job title/description, and proposal indexes `(job_id, status)` and `(freelancer_profile_id, created_at DESC)`.

## 6. Contracts, delivery, and payment tables

| Table                    | Description                                                                 | Relationships / constraints                                                                 |
| ------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `contracts`              | Accepted engagement created from proposal.                                  | Unique accepted proposal; FKs job, proposal, client, freelancer; status enum.               |
| `contract_participants`  | Explicit project membership.                                                | Unique `(contract_id, user_id)`; participant role enum.                                     |
| `milestones`             | Ordered contract deliverable and agreed amount.                             | FK contract restrict; unique `(contract_id, sequence)`; amount > 0; status enum.            |
| `deliveries`             | Freelancer delivery submissions.                                            | FK milestone restrict; state enum; immutable submitted snapshot.                            |
| `escrows`                | Application projection of on-chain escrow.                                  | Unique `(chain_id, contract_address, on_chain_escrow_id)`; one active escrow per milestone. |
| `escrow_transactions`    | Submitted/confirmed on-chain transaction references.                        | Unique `(chain_id, transaction_hash)`; event type/status enum; FK escrow restrict.          |
| `escrow_events`          | Deduplicated raw confirmed contract events.                                 | Unique `(chain_id, transaction_hash, log_index)`; FK escrow restrict; block metadata.       |
| `chain_sync_checkpoints` | Last processed block per chain/contract event stream.                       | Unique `(chain_id, contract_address, stream_name)`.                                         |
| `invoices`               | Platform invoice/payment statement metadata.                                | Unique invoice number; linked to contract/milestone where applicable; retained.             |
| `payments`               | Off-chain payment provider records, reserved for future fiat/platform fees. | Unique provider transaction identifier; does not substitute escrow truth.                   |

`contracts` are the product term for accepted jobs; they are not Solidity contracts. Use `escrows` for on-chain contract instances to prevent ambiguity. A client cannot have more than one accepted proposal per job without an explicit multi-hire product decision. Milestone amount must be positive; summed milestones are validated against agreed contract amount at transaction time.

## 7. Collaboration and trust tables

| Table                      | Description                                       | Relationships / constraints                                                                  |
| -------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `conversations`            | Private conversation, initially one per contract. | Unique contract conversation type; visibility enum.                                          |
| `conversation_members`     | Conversation authorization/read state.            | Unique `(conversation_id, user_id)`; FK user restrict.                                       |
| `messages`                 | Durable message content and type.                 | FK conversation restrict, sender restrict; cursor index `(conversation_id, created_at, id)`. |
| `message_attachments`      | Secure attachment metadata.                       | FK message cascade; object key unique; malware/processing status.                            |
| `notifications`            | In-app notification inbox.                        | FK user cascade; index `(user_id, read_at, created_at DESC)`.                                |
| `notification_preferences` | Channel/event preferences.                        | Unique `(user_id, notification_type, channel)`.                                              |
| `reviews`                  | Bilateral completed-contract reviews.             | Unique `(contract_id, reviewer_user_id)`; FK reviewee; rating check 1–5.                     |
| `reports`                  | Abuse/content/dispute report intake.              | FKs reporter and subject as appropriate; status/severity enums.                              |
| `moderation_actions`       | Administrator decisions for a report.             | FK report restrict, actor restrict; reason required.                                         |
| `audit_logs`               | Immutable security and operational audit record.  | Actor FK set null; append-only; indexes by entity, actor, action, timestamp.                 |

Message bodies are sanitized and attachment objects are private by default. Deleting a user must preserve financial, moderation, and audit history through anonymization or restrictive policies rather than cascading removal.

## 8. AI and platform operations tables

| Table           | Description                                     | Relationships / constraints                                                            |
| --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ai_requests`   | Auditable queued AI task and quota record.      | FK user restrict; feature/status enum; idempotency key unique per user/action.         |
| `ai_outputs`    | Versioned structured draft output.              | FK request cascade; model metadata/cost; output is private until user saves/publishes. |
| `outbox_events` | Transactional events for asynchronous delivery. | Unique idempotency key; status/attempt index.                                          |
| `file_assets`   | Reusable secure storage metadata.               | Object key unique; owner FK; size/MIME checks; scanning status.                        |

## 9. Foreign-key deletion policy

- `CASCADE`: ephemeral dependent data such as OAuth accounts, profile skills, portfolio items, job skills, saved jobs, and message attachments.
- `RESTRICT`: business records requiring an intentional lifecycle—jobs, proposals, contracts, milestones, escrows, reviews, reports.
- `SET NULL`: historical actor references in audit/moderation records where account removal/anonymization is permitted.
- Never cascade-delete blockchain, invoice, payment, or audit evidence.

## 10. Cross-cutting constraints and indexes

- All human-readable identifiers use normalized unique values (email, handles, slugs, wallet addresses).
- Use `CHECK` constraints for nonnegative amounts, valid date ranges, rating bounds, and mutually exclusive visibility/state attributes.
- Use partial unique indexes for active primary wallets and one active project conversation per contract.
- All high-cardinality lists have an index matching their authorization/filter/order pattern.
- Full-text job search uses a generated `tsvector` with GIN index; filter facets retain ordinary B-tree indexes.
- Financial tables store `currency` as a constrained ISO code and `amount_minor` as `bigint`.
- Database transactions wrap acceptance/hiring, milestone state changes, delivery approval, and outbox emission.
