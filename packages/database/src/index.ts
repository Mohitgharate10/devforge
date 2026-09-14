import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from '@prisma/client';
export {
  UserStatus,
  TokenType,
  AvailabilityStatus,
  SkillProficiency,
  JobStatus,
  SkillRequirementLevel,
  ProposalStatus,
  ContractStatus,
  ParticipantRole,
  MilestoneStatus,
  DeliveryStatus,
  MessageType,
  NotificationType,
  NotificationChannel,
  EscrowStatus,
  EscrowTxStatus,
  AiFeatureType,
  AiRequestStatus,
  ReportStatus,
  ReportSeverity,
} from '@prisma/client';
export type {
  User,
  Account,
  Session,
  VerificationToken,
  Role,
  Permission,
  RolePermission,
  UserRole,
  Wallet,
  WalletNonce,
  FreelancerProfile,
  ClientProfile,
  Skill,
  FreelancerSkill,
  PortfolioProject,
  Experience,
  Certification,
  JobCategory,
  Job,
  JobSkill,
  SavedJob,
  Proposal,
  ProposalStatusHistory,
  Contract,
  ContractParticipant,
  Milestone,
  Delivery,
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
  Notification,
  NotificationPreference,
  Escrow,
  EscrowTransaction,
  EscrowEvent,
  AiRequest,
  AiOutput,
  Review,
  Report,
  ModerationAction,
  AuditLog,
} from '@prisma/client';
