-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_AVAILABLE', 'BUSY', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "SkillProficiency" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SkillRequirementLevel" AS ENUM ('REQUIRED', 'PREFERRED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED', 'WITHDRAWN', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'TERMINATED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('CLIENT', 'FREELANCER', 'ARBITRATOR', 'OBSERVER');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'FUNDED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM', 'FILE', 'DELIVERY_SUBMITTED', 'ESCROW_RELEASED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PROPOSAL_RECEIVED', 'PROPOSAL_ACCEPTED', 'DELIVERY_SUBMITTED', 'MILESTONE_APPROVED', 'MESSAGE_RECEIVED', 'DISPUTE_OPENED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'WEB_PUSH');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING_DEPOSIT', 'HELD', 'RELEASED', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EscrowTxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiFeatureType" AS ENUM ('JOB_DESCRIPTION', 'PROPOSAL_DRAFT', 'RESUME_REVIEW', 'SKILL_MATCH');

-- CreateEnum
CREATE TYPE "AiRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_by" UUID,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_nonces" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "address" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "nonce" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freelancer_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "hourly_rate" BIGINT,
    "availability" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freelancer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freelancer_skills" (
    "freelancer_profile_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "proficiency" "SkillProficiency" NOT NULL DEFAULT 'INTERMEDIATE',
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "freelancer_skills_pkey" PRIMARY KEY ("freelancer_profile_id","skill_id")
);

-- CreateTable
CREATE TABLE "portfolio_projects" (
    "id" UUID NOT NULL,
    "freelancer_profile_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "project_url" TEXT,
    "repository_url" TEXT,
    "cover_image_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "freelancer_profile_id" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" UUID NOT NULL,
    "freelancer_profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "credential_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "client_profile_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget_min" BIGINT,
    "budget_max" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skills" (
    "job_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "requirement_level" "SkillRequirementLevel" NOT NULL DEFAULT 'REQUIRED',

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("job_id","skill_id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("user_id","job_id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "freelancer_profile_id" UUID NOT NULL,
    "cover_letter" TEXT NOT NULL,
    "bid_amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ProposalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_status_history" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "from_status" "ProposalStatus",
    "to_status" "ProposalStatus" NOT NULL,
    "actor_id" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "client_profile_id" UUID NOT NULL,
    "freelancer_profile_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_participants" (
    "contract_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'FREELANCER',

    CONSTRAINT "contract_participants_pkey" PRIMARY KEY ("contract_id","user_id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" BIGINT NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "freelancer_profile_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SUBMITTED',
    "feedback" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "contract_id" UUID,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "last_read_message_id" UUID,
    "last_read_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id","type","channel")
);

-- CreateTable
CREATE TABLE "escrows" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "contract_address" TEXT NOT NULL,
    "on_chain_escrow_id" BIGINT,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "status" "EscrowStatus" NOT NULL DEFAULT 'PENDING_DEPOSIT',
    "funder_address" TEXT,
    "recipient_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" UUID NOT NULL,
    "escrow_id" UUID NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "EscrowTxStatus" NOT NULL DEFAULT 'PENDING',
    "block_number" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_events" (
    "id" UUID NOT NULL,
    "escrow_id" UUID NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_data" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "feature" "AiFeatureType" NOT NULL,
    "status" "AiRequestStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "error" TEXT,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_outputs" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "structured_json" TEXT,
    "is_applied" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "reviewee_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "severity" "ReportSeverity" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "moderator_id" UUID NOT NULL,
    "action_taken" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_created_at_idx" ON "users"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_provider_account_id_key" ON "accounts"("provider_id", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "verification_tokens_expires_at_idx" ON "verification_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_chain_id_address_key" ON "wallets"("chain_id", "address");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_nonces_nonce_key" ON "wallet_nonces"("nonce");

-- CreateIndex
CREATE INDEX "wallet_nonces_expires_at_idx" ON "wallet_nonces"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "freelancer_profiles_user_id_key" ON "freelancer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "freelancer_profiles_handle_key" ON "freelancer_profiles"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_user_id_key" ON "client_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_slug_key" ON "client_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "job_categories_slug_key" ON "job_categories"("slug");

-- CreateIndex
CREATE INDEX "jobs_status_category_id_published_at_idx" ON "jobs"("status", "category_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "jobs_client_profile_id_status_updated_at_idx" ON "jobs"("client_profile_id", "status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "proposals_job_id_status_idx" ON "proposals"("job_id", "status");

-- CreateIndex
CREATE INDEX "proposals_freelancer_profile_id_created_at_idx" ON "proposals"("freelancer_profile_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proposals_job_id_freelancer_profile_id_key" ON "proposals"("job_id", "freelancer_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_proposal_id_key" ON "contracts"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_contract_id_sequence_key" ON "milestones"("contract_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_contract_id_key" ON "conversations"("contract_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "escrows_milestone_id_key" ON "escrows"("milestone_id");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_tx_hash_key" ON "escrow_transactions"("tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_events_chain_id_tx_hash_log_index_key" ON "escrow_events"("chain_id", "tx_hash", "log_index");

-- CreateIndex
CREATE UNIQUE INDEX "ai_outputs_request_id_key" ON "ai_outputs"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_contract_id_reviewer_id_key" ON "reviews"("contract_id", "reviewer_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_nonces" ADD CONSTRAINT "wallet_nonces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_categories" ADD CONSTRAINT "job_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "job_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_status_history" ADD CONSTRAINT "proposal_status_history_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_profile_id_fkey" FOREIGN KEY ("client_profile_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_participants" ADD CONSTRAINT "contract_participants_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_participants" ADD CONSTRAINT "contract_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_freelancer_profile_id_fkey" FOREIGN KEY ("freelancer_profile_id") REFERENCES "freelancer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_events" ADD CONSTRAINT "escrow_events_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_outputs" ADD CONSTRAINT "ai_outputs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "ai_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
