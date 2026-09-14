import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'STATE_TRANSITION_INVALID',
  'RATE_LIMITED',
  'EXTERNAL_DEPENDENCY_FAILED',
  'INTERNAL_ERROR',
]);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export type ApiMeta = {
  requestId: string;
};

export type ApiSuccess<T> = {
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  error: {
    code: ApiErrorCode;
    message: string;
    details: unknown[];
  };
  meta: ApiMeta;
};

export const healthStatusSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  service: z.literal('web'),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;

// ─── Auth Schemas ────────────────────────────────────────

export const signUpRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be at most 128 characters.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(100, 'Display name must be at most 100 characters.'),
  role: z.enum(['freelancer', 'client']).default('freelancer'),
  handle: z.string().optional(),
});

export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

export const signInRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const passwordForgotRequestSchema = z.object({
  email: z.string().email(),
});

export type PasswordForgotRequest = z.infer<typeof passwordForgotRequestSchema>;

export const passwordResetRequestSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be at most 128 characters.'),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

export const emailVerifyRequestSchema = z.object({
  token: z.string().min(1),
});

export type EmailVerifyRequest = z.infer<typeof emailVerifyRequestSchema>;

export const updateUserRequestSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(100, 'Display name must be at most 100 characters.')
    .optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().max(50).optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const deleteAccountRequestSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});

export type DeleteAccountRequest = z.infer<typeof deleteAccountRequestSchema>;

// ─── Wallet Schemas ──────────────────────────────────────

export const walletNonceRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address.'),
  chainId: z.number().int().positive(),
  action: z.enum(['authenticate', 'link']),
});

export type WalletNonceRequest = z.infer<typeof walletNonceRequestSchema>;

export const walletVerifyRequestSchema = z.object({
  message: z.string().min(1),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature format.'),
  nonce: z.string().min(1),
});

export type WalletVerifyRequest = z.infer<typeof walletVerifyRequestSchema>;

// ─── Response Schemas ────────────────────────────────────

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  emailVerified: z.boolean(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED']),
  roles: z.array(z.string()),
  createdAt: z.string().datetime(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const sessionResponseSchema = z.object({
  user: userResponseSchema.nullable(),
  expiresAt: z.string().datetime().nullable(),
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const walletResponseSchema = z.object({
  id: z.string().uuid(),
  chainId: z.number(),
  address: z.string(),
  isPrimary: z.boolean(),
  label: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type WalletResponse = z.infer<typeof walletResponseSchema>;

// ─── Sprint 3: Profiles & Taxonomy Schemas ───────────────

export const availabilityStatusSchema = z.enum([
  'AVAILABLE',
  'PARTIALLY_AVAILABLE',
  'BUSY',
  'UNAVAILABLE',
]);

export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;

export const skillProficiencySchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT']);
export type SkillProficiency = z.infer<typeof skillProficiencySchema>;

export const upsertFreelancerProfileSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters.')
    .max(30, 'Handle must be at most 30 characters.')
    .regex(/^[a-z0-9-]+$/, 'Handle may only contain lowercase letters, numbers, and hyphens.'),
  title: z.string().min(2).max(120),
  bio: z.string().min(10).max(2000),
  hourlyRate: z.number().int().nonnegative().optional(), // In cents/minor unit
  availability: availabilityStatusSchema.default('AVAILABLE'),
});

export type UpsertFreelancerProfileRequest = z.infer<typeof upsertFreelancerProfileSchema>;

export const addFreelancerSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: skillProficiencySchema.default('INTERMEDIATE'),
  displayOrder: z.number().int().default(0),
});

export type AddFreelancerSkillRequest = z.infer<typeof addFreelancerSkillSchema>;

export const portfolioProjectSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(3000),
  projectUrl: z.string().url().optional().or(z.literal('')),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export type PortfolioProjectRequest = z.infer<typeof portfolioProjectSchema>;

export const updatePortfolioProjectSchema = portfolioProjectSchema.partial();
export type UpdatePortfolioProjectRequest = z.infer<typeof updatePortfolioProjectSchema>;

export const upsertClientProfileSchema = z.object({
  organizationName: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens.')
    .optional(),
  description: z.string().max(3000).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export type UpsertClientProfileRequest = z.infer<typeof upsertClientProfileSchema>;

export const searchFreelancersQuerySchema = z.object({
  q: z.string().optional(),
  skills: z.string().optional(), // comma-delimited slugs
  availability: availabilityStatusSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type SearchFreelancersQuery = z.infer<typeof searchFreelancersQuerySchema>;

// ─── Marketplace Schemas ─────────────────────────────────

export const jobStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED']);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const skillRequirementLevelSchema = z.enum(['REQUIRED', 'PREFERRED']);
export type SkillRequirementLevel = z.infer<typeof skillRequirementLevelSchema>;

export const createJobRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.').max(150),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  categoryId: z.string().uuid('Invalid category ID.'),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  currency: z.string().default('USD'),
  skills: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        requirementLevel: skillRequirementLevelSchema.default('REQUIRED'),
      }),
    )
    .optional(),
});

export type CreateJobRequest = z.infer<typeof createJobRequestSchema>;

export const updateJobRequestSchema = createJobRequestSchema.partial();
export type UpdateJobRequest = z.infer<typeof updateJobRequestSchema>;

export const searchJobsQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  skills: z.string().optional(),
  status: jobStatusSchema.default('PUBLISHED'),
  minBudget: z.coerce.number().nonnegative().optional(),
  maxBudget: z.coerce.number().nonnegative().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type SearchJobsQuery = z.infer<typeof searchJobsQuerySchema>;

export const jobResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }),
  client: z.object({
    id: z.string().uuid(),
    organizationName: z.string(),
    slug: z.string().nullable(),
  }),
  budgetMin: z.number().nullable(),
  budgetMax: z.number().nullable(),
  currency: z.string(),
  status: jobStatusSchema,
  skills: z.array(
    z.object({
      skillId: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      requirementLevel: skillRequirementLevelSchema,
    }),
  ),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type JobResponse = z.infer<typeof jobResponseSchema>;

// ─── Sprint 5: Proposals, Hiring & Contracts Schemas ──────

export const proposalStatusSchema = z.enum([
  'SUBMITTED',
  'WITHDRAWN',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
]);
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

export const contractStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'TERMINATED', 'DISPUTED']);
export type ContractStatus = z.infer<typeof contractStatusSchema>;

export const participantRoleSchema = z.enum(['CLIENT', 'FREELANCER', 'ARBITRATOR', 'OBSERVER']);
export type ParticipantRole = z.infer<typeof participantRoleSchema>;

export const milestoneStatusSchema = z.enum([
  'PENDING',
  'FUNDED',
  'IN_PROGRESS',
  'SUBMITTED',
  'APPROVED',
  'DISPUTED',
  'REFUNDED',
]);
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;

export const deliveryStatusSchema = z.enum(['SUBMITTED', 'ACCEPTED', 'REJECTED']);
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

export const createProposalRequestSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters.'),
  bidAmount: z.number().int().positive('Bid amount must be a positive integer.'),
  currency: z.string().default('USD'),
});
export type CreateProposalRequest = z.infer<typeof createProposalRequestSchema>;

export const updateProposalRequestSchema = z.object({
  coverLetter: z.string().min(10).optional(),
  bidAmount: z.number().int().positive().optional(),
});
export type UpdateProposalRequest = z.infer<typeof updateProposalRequestSchema>;

export const milestoneDraftSchema = z.object({
  title: z.string().min(2, 'Milestone title is required.'),
  description: z.string().optional(),
  amount: z.number().int().positive('Milestone amount must be positive.'),
  dueDate: z.string().optional(),
});
export type MilestoneDraft = z.infer<typeof milestoneDraftSchema>;

export const acceptProposalRequestSchema = z.object({
  milestones: z.array(milestoneDraftSchema).min(1, 'At least one milestone is required.'),
});
export type AcceptProposalRequest = z.infer<typeof acceptProposalRequestSchema>;

export const rejectProposalRequestSchema = z.object({
  reason: z.string().optional(),
});
export type RejectProposalRequest = z.infer<typeof rejectProposalRequestSchema>;

export const proposalResponseSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  jobTitle: z.string().optional(),
  freelancerProfileId: z.string().uuid(),
  freelancer: z
    .object({
      id: z.string().uuid(),
      displayName: z.string(),
      handle: z.string(),
      title: z.string(),
      avatarUrl: z.string().nullable(),
    })
    .optional(),
  coverLetter: z.string(),
  bidAmount: z.number(),
  currency: z.string(),
  status: proposalStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ProposalResponse = z.infer<typeof proposalResponseSchema>;

export const submitDeliveryRequestSchema = z.object({
  description: z.string().min(10, 'Delivery description must be at least 10 characters.'),
});
export type SubmitDeliveryRequest = z.infer<typeof submitDeliveryRequestSchema>;

export const approveDeliveryRequestSchema = z.object({
  feedback: z.string().optional(),
});
export type ApproveDeliveryRequest = z.infer<typeof approveDeliveryRequestSchema>;

export const deliveryResponseSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid(),
  freelancerProfileId: z.string().uuid(),
  description: z.string(),
  status: deliveryStatusSchema,
  feedback: z.string().nullable(),
  submittedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().nullable(),
});
export type DeliveryResponse = z.infer<typeof deliveryResponseSchema>;

export const milestoneResponseSchema = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  sequence: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  amount: z.number(),
  dueDate: z.string().nullable(),
  status: milestoneStatusSchema,
  deliveries: z.array(deliveryResponseSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MilestoneResponse = z.infer<typeof milestoneResponseSchema>;

export const contractResponseSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  proposalId: z.string().uuid(),
  title: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  status: contractStatusSchema,
  client: z.object({
    id: z.string().uuid(),
    organizationName: z.string(),
    slug: z.string().nullable(),
  }),
  freelancer: z.object({
    id: z.string().uuid(),
    handle: z.string(),
    displayName: z.string(),
    title: z.string(),
  }),
  milestonesCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ContractResponse = z.infer<typeof contractResponseSchema>;

export const contractDetailResponseSchema = contractResponseSchema.extend({
  milestones: z.array(milestoneResponseSchema),
  participants: z.array(
    z.object({
      userId: z.string().uuid(),
      role: participantRoleSchema,
    }),
  ),
});
export type ContractDetailResponse = z.infer<typeof contractDetailResponseSchema>;

export const createDisputeRequestSchema = z.object({
  reason: z.string().min(10, 'Dispute reason must be at least 10 characters.'),
});
export type CreateDisputeRequest = z.infer<typeof createDisputeRequestSchema>;

// ─── Sprint 6: Collaboration & Notifications ─────────────

export const messageTypeSchema = z.enum([
  'TEXT',
  'SYSTEM',
  'FILE',
  'DELIVERY_SUBMITTED',
  'ESCROW_RELEASED',
]);
export type MessageType = z.infer<typeof messageTypeSchema>;

export const sendMessageRequestSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty.').max(4000),
  type: messageTypeSchema.default('TEXT'),
});
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const messageResponseSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderName: z.string(),
  senderAvatar: z.string().nullable(),
  content: z.string(),
  type: messageTypeSchema,
  createdAt: z.string().datetime(),
});
export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const conversationMemberSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});
export type ConversationMember = z.infer<typeof conversationMemberSchema>;

export const conversationResponseSchema = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid().nullable(),
  title: z.string().nullable(),
  members: z.array(conversationMemberSchema),
  lastMessage: messageResponseSchema.nullable(),
  unreadCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ConversationResponse = z.infer<typeof conversationResponseSchema>;

export const notificationTypeSchema = z.enum([
  'PROPOSAL_RECEIVED',
  'PROPOSAL_ACCEPTED',
  'DELIVERY_SUBMITTED',
  'MILESTONE_APPROVED',
  'MESSAGE_RECEIVED',
  'DISPUTE_OPENED',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  linkUrl: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

// ─── Sprint 7: Decentralized Escrow Schemas ───────────────

export const escrowStatusSchema = z.enum([
  'PENDING',
  'DEPOSITED',
  'RELEASED',
  'REFUNDED',
  'DISPUTED',
]);
export type EscrowStatus = z.infer<typeof escrowStatusSchema>;

export const depositEscrowRequestSchema = z.object({
  milestoneId: z.string().uuid(),
  milestoneIndex: z.number().int().nonnegative(),
  amountEth: z.string().min(1),
  clientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  freelancerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});
export type DepositEscrowRequest = z.infer<typeof depositEscrowRequestSchema>;

export const releaseEscrowRequestSchema = z.object({
  milestoneId: z.string().uuid(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});
export type ReleaseEscrowRequest = z.infer<typeof releaseEscrowRequestSchema>;

export const raiseDisputeEscrowRequestSchema = z.object({
  milestoneId: z.string().uuid(),
  reason: z.string().min(10),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
});
export type RaiseDisputeEscrowRequest = z.infer<typeof raiseDisputeEscrowRequestSchema>;

export const escrowResponseSchema = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  milestoneId: z.string().uuid().nullable(),
  vaultKey: z.string(),
  chainId: z.number().int(),
  status: escrowStatusSchema,
  amount: z.string(),
  tokenSymbol: z.string(),
  clientAddress: z.string(),
  freelancerAddress: z.string(),
  depositTxHash: z.string().nullable(),
  releaseTxHash: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type EscrowResponse = z.infer<typeof escrowResponseSchema>;

// ─── Sprint 8: AI Assistance Schemas ─────────────────────

export const aiGenerateJobRequestSchema = z.object({
  title: z.string().min(3),
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
});
export type AiGenerateJobRequest = z.infer<typeof aiGenerateJobRequestSchema>;

export const aiGenerateJobResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  suggestedBudgetMin: z.number(),
  suggestedBudgetMax: z.number(),
  milestones: z.array(
    z.object({
      title: z.string(),
      percentage: z.number(),
      description: z.string(),
    }),
  ),
});
export type AiGenerateJobResponse = z.infer<typeof aiGenerateJobResponseSchema>;

export const aiGenerateProposalRequestSchema = z.object({
  jobTitle: z.string().min(3),
  freelancerName: z.string().min(1),
  skills: z.array(z.string()),
});
export type AiGenerateProposalRequest = z.infer<typeof aiGenerateProposalRequestSchema>;

export const aiGenerateProposalResponseSchema = z.object({
  coverLetter: z.string(),
  suggestedRate: z.number(),
});
export type AiGenerateProposalResponse = z.infer<typeof aiGenerateProposalResponseSchema>;

export const aiSkillMatchRequestSchema = z.object({
  requiredSkills: z.array(z.string()),
  candidateSkills: z.array(z.string()),
});
export type AiSkillMatchRequest = z.infer<typeof aiSkillMatchRequestSchema>;

export const aiSkillMatchResponseSchema = z.object({
  score: z.number(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  tier: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'LOW']),
  explanation: z.string(),
});
export type AiSkillMatchResponse = z.infer<typeof aiSkillMatchResponseSchema>;

// ─── Sprint 9: Trust, Reviews & Moderation Schemas ───────

export const createReviewRequestSchema = z.object({
  targetId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().min(10).max(2000),
  qualityRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  deadlineRating: z.number().int().min(1).max(5).optional(),
});
export type CreateReviewRequest = z.infer<typeof createReviewRequestSchema>;

export const reviewResponseSchema = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string(),
  targetId: z.string().uuid(),
  rating: z.number(),
  feedback: z.string(),
  qualityRating: z.number().nullable(),
  communicationRating: z.number().nullable(),
  deadlineRating: z.number().nullable(),
  isRevealed: z.boolean(),
  createdAt: z.string().datetime(),
});
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;

export const createReportRequestSchema = z.object({
  targetType: z.enum(['USER', 'JOB', 'PROPOSAL', 'MESSAGE', 'CONTRACT']),
  targetId: z.string().uuid(),
  category: z.string().min(2),
  reason: z.string().min(10).max(2000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});
export type CreateReportRequest = z.infer<typeof createReportRequestSchema>;

export const reportResponseSchema = z.object({
  id: z.string().uuid(),
  reporterId: z.string().uuid(),
  targetType: z.string(),
  targetId: z.string().uuid(),
  category: z.string(),
  reason: z.string(),
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  createdAt: z.string().datetime(),
});
export type ReportResponse = z.infer<typeof reportResponseSchema>;

export const adminAnalyticsResponseSchema = z.object({
  activeContractsCount: z.number(),
  totalEscrowVolumeEth: z.number(),
  totalDisputesCount: z.number(),
  resolvedDisputesCount: z.number(),
  platformFeeEth: z.number(),
  averageRating: z.number(),
  totalUsersCount: z.number(),
});
export type AdminAnalyticsResponse = z.infer<typeof adminAnalyticsResponseSchema>;

