# DevForge REST API Design

## 1. Conventions

- Base path: `/api/v1`; JSON request/response; UTC ISO-8601 timestamps; UUID resources.
- Successful response: `{ "data": {}, "meta": { "requestId": "..." } }`.
- Error response: `{ "error": { "code": "...", "message": "...", "details": [] }, "meta": { "requestId": "..." } }`.
- Pagination: cursor parameters `cursor` and `limit` (1–100) for feeds/messages. Search may expose validated `page`/`pageSize` only where total pages are product-critical.
- Authentication uses secure session cookie. Realtime service token endpoints return a short-lived signed token only after session validation.
- All write endpoints require CSRF protection, content type validation, rate limiting, and idempotency keys where retries can duplicate a business/financial operation.

### Standard errors

| HTTP    | Code                         | Meaning                                                |
| ------- | ---------------------------- | ------------------------------------------------------ |
| 400     | `VALIDATION_FAILED`          | Invalid schema, query, or state-independent input.     |
| 401     | `UNAUTHENTICATED`            | Missing/invalid/expired session.                       |
| 403     | `FORBIDDEN`                  | Authenticated actor lacks role or resource access.     |
| 404     | `NOT_FOUND`                  | Resource unavailable to the actor.                     |
| 409     | `CONFLICT`                   | Duplicate, stale version, or invalid state transition. |
| 422     | `STATE_TRANSITION_INVALID`   | Valid input but disallowed lifecycle transition.       |
| 429     | `RATE_LIMITED`               | Request budget exceeded.                               |
| 502/503 | `EXTERNAL_DEPENDENCY_FAILED` | Provider/RPC/AI dependency unavailable.                |

## 2. Authentication

| Method / URL                 | Purpose                        | Auth / authorization  | Request validation                                   | Success / key errors                           |
| ---------------------------- | ------------------------------ | --------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `POST /auth/sign-up`         | Create email/password account. | Public.               | Email normalized; password strength; consent fields. | `201 user`; `409 EMAIL_EXISTS`, `429`.         |
| `POST /auth/sign-in`         | Begin email/password session.  | Public.               | Email/password required; rate limited.               | `200 user/session`; `401 INVALID_CREDENTIALS`. |
| `POST /auth/sign-out`        | Revoke current session.        | Session required.     | No body.                                             | `204`; `401`.                                  |
| `GET /auth/google`           | Start Google OAuth.            | Public.               | Safe callback URL allowlist.                         | Redirect; `400`.                               |
| `GET /auth/google/callback`  | Complete OAuth.                | OAuth state required. | Provider state/PKCE verification.                    | Redirect/session; `401`.                       |
| `POST /auth/email/verify`    | Verify email token.            | Public token.         | One-time unexpired token.                            | `200`; `400 TOKEN_INVALID`.                    |
| `POST /auth/password/forgot` | Request reset email.           | Public.               | Normalized email; always generic response.           | `202`; rate limit.                             |
| `POST /auth/password/reset`  | Reset password.                | Reset token.          | Token, strong password.                              | `204`; `400 TOKEN_INVALID`.                    |
| `GET /auth/session`          | Read current session/user.     | Optional session.     | None.                                                | `200 session or null`.                         |

## 3. Users

| Method / URL           | Purpose                                         | Auth / authorization             | Request / validation                   | Response / errors                      |
| ---------------------- | ----------------------------------------------- | -------------------------------- | -------------------------------------- | -------------------------------------- |
| `GET /me`              | Current user and role/profile summary.          | Session.                         | None.                                  | `200 user`; `401`.                     |
| `PATCH /me`            | Update account display details.                 | Session, self.                   | Allowlisted name/avatar/timezone only. | `200 user`; `400`, `409`.              |
| `DELETE /me`           | Request account closure/anonymization workflow. | Session, self, recent auth.      | Confirmation phrase.                   | `202`; `409 ACTIVE_FINANCIAL_RECORDS`. |
| `GET /users/:userId`   | Limited public identity record.                 | Public where visibility permits. | UUID.                                  | `200`; `404`.                          |
| `POST /realtime/token` | Create short-lived Socket.IO token.             | Session.                         | Device metadata limited.               | `201 token`; `429`.                    |

## 4. Freelancers and clients

| Method / URL                                 | Purpose                            | Auth / authorization   | Request / validation                         | Response / errors          |
| -------------------------------------------- | ---------------------------------- | ---------------------- | -------------------------------------------- | -------------------------- |
| `GET /freelancers`                           | Search public freelancer profiles. | Public.                | Cursor, skills, availability, query filters. | `200 list`; `400`.         |
| `GET /freelancers/:handle`                   | Public profile.                    | Public.                | Normalized handle.                           | `200 profile`; `404`.      |
| `PUT /freelancer-profile`                    | Create/update own profile.         | Freelancer role, self. | Bio length, handle, rate, availability.      | `200`; `409 HANDLE_TAKEN`. |
| `POST /freelancer-profile/skills`            | Add skill.                         | Freelancer, self.      | Active skill UUID, proficiency.              | `201`; `409`.              |
| `DELETE /freelancer-profile/skills/:skillId` | Remove skill.                      | Freelancer, self.      | UUID.                                        | `204`; `404`.              |
| `POST /freelancer-profile/portfolio`         | Add portfolio item.                | Freelancer, self.      | Sanitized URL/text, visibility.              | `201`; `400`.              |
| `PATCH /freelancer-profile/portfolio/:id`    | Edit portfolio item.               | Freelancer, owner.     | Allowlisted fields.                          | `200`; `403/404`.          |
| `DELETE /freelancer-profile/portfolio/:id`   | Remove portfolio item.             | Freelancer, owner.     | UUID.                                        | `204`; `403/404`.          |
| `GET /clients/:slug`                         | Public client profile.             | Public.                | Slug.                                        | `200`; `404`.              |
| `PUT /client-profile`                        | Create/update own client profile.  | Client role, self.     | Organization name, description, website.     | `200`; `409`.              |

## 5. Jobs

| Method / URL                | Purpose                          | Auth / authorization | Request / validation                                          | Response / errors                   |
| --------------------------- | -------------------------------- | -------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `GET /jobs`                 | Search published jobs.           | Public.              | Cursor, q, category, skills, budget, type, sort.              | `200 list`; `400`.                  |
| `POST /jobs`                | Create draft job.                | Client role.         | Title, sanitized description, category, budget range, skills. | `201 job`; `400/422`.               |
| `GET /jobs/:jobId`          | Get visible job detail.          | Public/draft owner.  | UUID.                                                         | `200`; `404`.                       |
| `PATCH /jobs/:jobId`        | Update draft/allowed job fields. | Client owner.        | Optimistic version, allowlisted fields.                       | `200`; `403/409/422`.               |
| `DELETE /jobs/:jobId`       | Archive uncontracted job.        | Client owner.        | UUID.                                                         | `204`; `409 HAS_ACCEPTED_PROPOSAL`. |
| `POST /jobs/:jobId/publish` | Publish validated job.           | Client owner.        | Required fields complete.                                     | `200`; `422`.                       |
| `POST /jobs/:jobId/pause`   | Pause submissions.               | Client owner.        | Optional reason.                                              | `200`; `422`.                       |
| `POST /jobs/:jobId/close`   | Close submissions.               | Client owner.        | Optional reason.                                              | `200`; `422`.                       |
| `POST /jobs/:jobId/save`    | Save job.                        | Freelancer.          | UUID.                                                         | `201`; `409`.                       |
| `DELETE /jobs/:jobId/save`  | Remove saved job.                | Freelancer, self.    | UUID.                                                         | `204`.                              |
| `GET /job-categories`       | Active job taxonomy.             | Public.              | Optional parent.                                              | `200 list`.                         |

## 6. Proposals and contracts

| Method / URL                               | Purpose                                     | Auth / authorization                        | Request / validation                                  | Response / errors                     |
| ------------------------------------------ | ------------------------------------------- | ------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `POST /jobs/:jobId/proposals`              | Submit proposal.                            | Freelancer; profile complete; job open.     | Cover letter limits, bid amount, proposed milestones. | `201`; `409 ALREADY_PROPOSED`, `422`. |
| `GET /proposals`                           | List own sent/received proposals.           | Freelancer/client.                          | Scope, status, cursor.                                | `200 list`; `403`.                    |
| `GET /proposals/:proposalId`               | Proposal detail.                            | Submitter or job owner.                     | UUID.                                                 | `200`; `404`.                         |
| `PATCH /proposals/:proposalId`             | Edit submitted proposal before review lock. | Freelancer owner.                           | Version; allowlisted fields.                          | `200`; `409/422`.                     |
| `POST /proposals/:proposalId/withdraw`     | Withdraw own proposal.                      | Freelancer owner.                           | Optional reason.                                      | `200`; `422`.                         |
| `POST /proposals/:proposalId/accept`       | Hire freelancer and create contract.        | Job-owning client.                          | Idempotency key; finalized milestones.                | `201 contract`; `409`, `422`.         |
| `POST /proposals/:proposalId/reject`       | Reject proposal.                            | Job-owning client.                          | Optional feedback.                                    | `200`; `422`.                         |
| `GET /contracts`                           | List contracts for actor.                   | Contract participant.                       | Status/cursor.                                        | `200 list`.                           |
| `GET /contracts/:contractId`               | Project contract detail.                    | Contract participant/admin.                 | UUID.                                                 | `200`; `404`.                         |
| `POST /contracts/:contractId/milestones`   | Add a permitted milestone.                  | Client participant; contract state permits. | Sequence, title, positive amount, due date.           | `201`; `422`.                         |
| `PATCH /milestones/:milestoneId`           | Update un-funded milestone.                 | Client participant.                         | Version, allowlisted fields.                          | `200`; `409/422`.                     |
| `POST /milestones/:milestoneId/deliveries` | Submit work.                                | Freelancer participant.                     | Description, attachment IDs.                          | `201`; `422`.                         |
| `POST /deliveries/:deliveryId/approve`     | Accept delivery.                            | Client participant.                         | Optional feedback.                                    | `200`; `422`.                         |
| `POST /contracts/:contractId/disputes`     | Open dispute.                               | Contract participant.                       | Reason/category/evidence IDs.                         | `201`; `422`.                         |

## 7. Messaging and uploads

| Method / URL                              | Purpose                           | Auth / authorization         | Request / validation                              | Response / errors         |
| ----------------------------------------- | --------------------------------- | ---------------------------- | ------------------------------------------------- | ------------------------- |
| `GET /conversations`                      | List permitted conversations.     | Conversation member.         | Cursor, unread filter.                            | `200 list`.               |
| `GET /contracts/:contractId/conversation` | Get/create contract conversation. | Contract participant.        | UUID.                                             | `200`; `404`.             |
| `GET /conversations/:id/messages`         | Page durable messages.            | Conversation member.         | Cursor/limit.                                     | `200 list`; `403`.        |
| `POST /conversations/:id/messages`        | Persist and broadcast message.    | Conversation member.         | Sanitized body, type, asset IDs, idempotency key. | `201 message`; `422/429`. |
| `POST /conversations/:id/read`            | Update read cursor.               | Conversation member.         | Last message UUID.                                | `204`.                    |
| `POST /uploads/presign`                   | Obtain constrained upload URL.    | Session; authorized purpose. | MIME, size, filename, purpose.                    | `201 upload`; `400/413`.  |
| `POST /uploads/:assetId/complete`         | Confirm upload for scanning.      | Asset owner.                 | Checksum/size.                                    | `202`; `409`.             |

## 8. Notifications

| Method / URL                    | Purpose                           | Auth / authorization | Request / validation                | Response / errors |
| ------------------------------- | --------------------------------- | -------------------- | ----------------------------------- | ----------------- |
| `GET /notifications`            | List own notifications.           | Session, self.       | Cursor, unread filter.              | `200 list`.       |
| `POST /notifications/:id/read`  | Mark one read.                    | Owner.               | UUID.                               | `204`; `404`.     |
| `POST /notifications/read-all`  | Mark filtered notifications read. | Owner.               | Optional type filter.               | `204`.            |
| `GET /notification-preferences` | Read own preferences.             | Session, self.       | None.                               | `200`.            |
| `PUT /notification-preferences` | Replace validated preferences.    | Session, self.       | Per event/channel boolean settings. | `200`; `400`.     |

## 9. Payments and escrow

| Method / URL                                    | Purpose                                  | Auth / authorization                   | Request / validation                | Response / errors                   |
| ----------------------------------------------- | ---------------------------------------- | -------------------------------------- | ----------------------------------- | ----------------------------------- |
| `GET /contracts/:contractId/escrows`            | List contract escrow projections.        | Contract participant/admin.            | UUID.                               | `200`; `404`.                       |
| `POST /milestones/:milestoneId/escrow-intents`  | Create funding transaction intent.       | Client participant; milestone ready.   | Wallet/chain, idempotency key.      | `201 contract call payload`; `422`. |
| `POST /escrows/:escrowId/transactions`          | Record submitted transaction hash.       | Escrow client party.                   | Chain ID, tx hash, expected action. | `202`; `409 DUPLICATE_TX`.          |
| `GET /escrows/:escrowId`                        | Read confirmed/provisional escrow state. | Contract participant/admin.            | UUID.                               | `200`; `404`.                       |
| `POST /milestones/:milestoneId/release-intents` | Build client release call.               | Client participant; delivery approved. | Idempotency key.                    | `201 payload`; `422`.               |
| `POST /escrows/:escrowId/reconcile`             | Request state refresh.                   | Participant/admin; rate limited.       | UUID.                               | `202`; `429`.                       |
| `GET /invoices`                                 | List party invoices.                     | Invoice party/admin.                   | Cursor/status.                      | `200 list`.                         |
| `GET /invoices/:invoiceId`                      | Get invoice metadata.                    | Invoice party/admin.                   | UUID.                               | `200`; `404`.                       |

## 10. Wallet

| Method / URL                      | Purpose                                 | Auth / authorization                          | Request / validation                           | Response / errors                              |
| --------------------------------- | --------------------------------------- | --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `POST /wallets/nonce`             | Issue SIWE challenge.                   | Public or session link intent.                | Address, chain ID, action.                     | `201 message/nonce`; `429`.                    |
| `POST /wallets/verify`            | Verify signature and authenticate/link. | Valid nonce/signature; link requires session. | SIWE message/signature, nonce.                 | `200 wallet/session`; `400 SIGNATURE_INVALID`. |
| `GET /wallets`                    | List own linked wallets.                | Session, self.                                | None.                                          | `200 list`.                                    |
| `DELETE /wallets/:walletId`       | Unlink eligible wallet.                 | Wallet owner; recent auth.                    | UUID; cannot remove only required auth method. | `204`; `409`.                                  |
| `POST /wallets/:walletId/primary` | Choose primary wallet per chain.        | Wallet owner.                                 | UUID.                                          | `200`; `409`.                                  |

## 11. AI

| Method / URL                  | Purpose                        | Auth / authorization                 | Request / validation                          | Response / errors                    |
| ----------------------------- | ------------------------------ | ------------------------------------ | --------------------------------------------- | ------------------------------------ |
| `POST /ai/job-description`    | Queue job draft generation.    | Client.                              | Role/context/tone; length limits.             | `202 request`; `429 QUOTA_EXCEEDED`. |
| `POST /ai/proposal-draft`     | Queue private proposal draft.  | Freelancer with job visibility.      | Job ID, experience highlights.                | `202`; `403/429`.                    |
| `POST /ai/resume-review`      | Queue private resume analysis. | Freelancer/self.                     | Approved asset ID; file status must be clean. | `202`; `422`.                        |
| `POST /ai/skill-match`        | Queue match explanation.       | Job owner or freelancer participant. | Job/profile identifiers.                      | `202`; `403`.                        |
| `GET /ai/requests/:requestId` | Get own request status/output. | Request owner/admin.                 | UUID.                                         | `200`; `404`.                        |

## 12. Administration

| Method / URL                            | Purpose                                | Auth / authorization     | Request / validation                   | Response / errors          |
| --------------------------------------- | -------------------------------------- | ------------------------ | -------------------------------------- | -------------------------- |
| `GET /admin/reports`                    | Search moderation reports.             | Admin `reports:read`.    | Cursor/status/severity.                | `200 list`; `403`.         |
| `GET /admin/reports/:reportId`          | Read report evidence.                  | Admin `reports:read`.    | UUID.                                  | `200`; `404`.              |
| `POST /admin/reports/:reportId/actions` | Record moderation decision.            | Admin `reports:act`.     | Action, required reason, target state. | `201`; `422`; audit event. |
| `GET /admin/users`                      | Search users for support.              | Admin `users:read`.      | Query/cursor/status.                   | `200 list`.                |
| `POST /admin/users/:userId/suspend`     | Suspend account after policy decision. | Admin `users:manage`.    | Required reason/end date.              | `200`; audit event.        |
| `POST /admin/users/:userId/restore`     | Restore suspended account.             | Admin `users:manage`.    | Required reason.                       | `200`; audit event.        |
| `GET /admin/audit-logs`                 | Query immutable audit trail.           | Admin `audit:read`.      | Entity/actor/action/date filters.      | `200 list`.                |
| `POST /admin/job-categories`            | Create taxonomy category.              | Admin `taxonomy:manage`. | Unique name/slug/parent.               | `201`; `409`.              |
| `PATCH /admin/job-categories/:id`       | Update category.                       | Admin `taxonomy:manage`. | Allowlisted taxonomy fields.           | `200`; `409`.              |

Administrative writes require a reason, recent authentication where configured, and an immutable audit entry. No API endpoint permits an administrator to fabricate, alter, or delete confirmed blockchain event history.
