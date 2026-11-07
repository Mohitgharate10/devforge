import { DomainError, ForbiddenError } from '../identity/auth.errors';

export class InvalidContractTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition contract from state '${from}' to '${to}'.`,
      'STATE_TRANSITION_INVALID',
      422,
    );
    this.name = 'InvalidContractTransitionError';
  }
}

export class InvalidMilestoneTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition milestone from state '${from}' to '${to}'.`,
      'STATE_TRANSITION_INVALID',
      422,
    );
    this.name = 'InvalidMilestoneTransitionError';
  }
}

export class InvalidDeliveryTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition delivery from state '${from}' to '${to}'.`,
      'STATE_TRANSITION_INVALID',
      422,
    );
    this.name = 'InvalidDeliveryTransitionError';
  }
}

export type ContractStatusType = 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'DISPUTED';
export type ParticipantRoleType = 'CLIENT' | 'FREELANCER' | 'ARBITRATOR' | 'OBSERVER';
export type MilestoneStatusType =
  'PENDING' | 'FUNDED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'DISPUTED' | 'REFUNDED';
export type DeliveryStatusType = 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

const VALID_CONTRACT_TRANSITIONS: Record<ContractStatusType, ContractStatusType[]> = {
  ACTIVE: ['COMPLETED', 'TERMINATED', 'DISPUTED'],
  DISPUTED: ['ACTIVE', 'TERMINATED', 'COMPLETED'],
  COMPLETED: [],
  TERMINATED: [],
};

const VALID_MILESTONE_TRANSITIONS: Record<MilestoneStatusType, MilestoneStatusType[]> = {
  PENDING: ['FUNDED', 'REFUNDED'],
  FUNDED: ['IN_PROGRESS', 'SUBMITTED', 'DISPUTED', 'REFUNDED'],
  IN_PROGRESS: ['SUBMITTED', 'DISPUTED'],
  SUBMITTED: ['APPROVED', 'IN_PROGRESS', 'DISPUTED'],
  APPROVED: [],
  DISPUTED: ['IN_PROGRESS', 'APPROVED', 'REFUNDED'],
  REFUNDED: [],
};

const VALID_DELIVERY_TRANSITIONS: Record<DeliveryStatusType, DeliveryStatusType[]> = {
  SUBMITTED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
};

export function canTransitionContractStatus(
  current: ContractStatusType,
  target: ContractStatusType,
): boolean {
  return VALID_CONTRACT_TRANSITIONS[current]?.includes(target) ?? false;
}

export function assertCanTransitionContractStatus(
  current: ContractStatusType,
  target: ContractStatusType,
): void {
  if (!canTransitionContractStatus(current, target)) {
    throw new InvalidContractTransitionError(current, target);
  }
}

export function canTransitionMilestoneStatus(
  current: MilestoneStatusType,
  target: MilestoneStatusType,
): boolean {
  return VALID_MILESTONE_TRANSITIONS[current]?.includes(target) ?? false;
}

export function assertCanTransitionMilestoneStatus(
  current: MilestoneStatusType,
  target: MilestoneStatusType,
): void {
  if (!canTransitionMilestoneStatus(current, target)) {
    throw new InvalidMilestoneTransitionError(current, target);
  }
}

export function canTransitionDeliveryStatus(
  current: DeliveryStatusType,
  target: DeliveryStatusType,
): boolean {
  return VALID_DELIVERY_TRANSITIONS[current]?.includes(target) ?? false;
}

export function assertCanTransitionDeliveryStatus(
  current: DeliveryStatusType,
  target: DeliveryStatusType,
): void {
  if (!canTransitionDeliveryStatus(current, target)) {
    throw new InvalidDeliveryTransitionError(current, target);
  }
}

export function assertContractParticipant(
  actorUserId: string,
  participants: Array<{ userId: string; role: ParticipantRoleType }>,
): ParticipantRoleType {
  const match = participants.find((p) => p.userId === actorUserId);
  if (!match) {
    throw new ForbiddenError('You are not an authorized participant in this contract.');
  }
  return match.role;
}

export function assertContractRole(
  actorUserId: string,
  participants: Array<{ userId: string; role: ParticipantRoleType }>,
  requiredRole: ParticipantRoleType,
): void {
  const role = assertContractParticipant(actorUserId, participants);
  if (role !== requiredRole) {
    throw new ForbiddenError(
      `Only contract participants with role '${requiredRole}' can perform this action.`,
    );
  }
}

export function validateMilestonesSum(
  milestoneAmounts: Array<bigint | number>,
  totalAmount: bigint | number,
): boolean {
  const sum = milestoneAmounts.reduce<bigint>((acc, amt) => acc + BigInt(amt), BigInt(0));
  return sum === BigInt(totalAmount);
}

export function assertMilestonesSum(
  milestoneAmounts: Array<bigint | number>,
  totalAmount: bigint | number,
): void {
  if (!validateMilestonesSum(milestoneAmounts, totalAmount)) {
    throw new DomainError(
      'Sum of milestone amounts must exactly equal the total contract amount.',
      'VALIDATION_FAILED',
      400,
    );
  }
}
