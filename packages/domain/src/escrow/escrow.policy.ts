import { isAddress, keccak256, encodePacked, stringToHex } from 'viem';
import { DomainError } from '../identity/auth.errors';


export type EscrowStatus = 'PENDING' | 'DEPOSITED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';

const VALID_ESCROW_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  PENDING: ['DEPOSITED'],
  DEPOSITED: ['RELEASED', 'DISPUTED', 'REFUNDED'],
  DISPUTED: ['RELEASED', 'REFUNDED'],
  RELEASED: [],
  REFUNDED: [],
};

export function canTransitionEscrowStatus(current: EscrowStatus, target: EscrowStatus): boolean {
  return VALID_ESCROW_TRANSITIONS[current]?.includes(target) ?? false;
}

export function assertValidEscrowTransition(current: EscrowStatus, target: EscrowStatus): void {
  if (!canTransitionEscrowStatus(current, target)) {
    throw new DomainError(
      `Invalid escrow state transition from ${current} to ${target}`,
      'STATE_TRANSITION_INVALID',
      400,
    );
  }
}

/**
 * Computes deterministic bytes32 vault key matching DevForgeEscrow.sol:
 * keccak256(abi.encodePacked(bytes32(contractId), uint256(milestoneIndex)))
 */
export function computeVaultKey(contractId: string, milestoneIndex: number): `0x${string}` {
  // Normalize contractId to 32 bytes hex
  let contractIdBytes32: `0x${string}`;
  if (contractId.startsWith('0x') && contractId.length === 66) {
    contractIdBytes32 = contractId as `0x${string}`;
  } else {
    // Hash the contract string ID (e.g. UUID) into bytes32
    contractIdBytes32 = keccak256(stringToHex(contractId));
  }

  return keccak256(
    encodePacked(
      ['bytes32', 'uint256'],
      [contractIdBytes32, BigInt(milestoneIndex)],
    ),
  );
}

export interface EscrowParticipantContext {
  userId: string;
  isClient: boolean;
  isFreelancer: boolean;
  isAdmin: boolean;
}

export function canDepositEscrow(ctx: EscrowParticipantContext, currentStatus: EscrowStatus): boolean {
  return (ctx.isClient || ctx.isAdmin) && currentStatus === 'PENDING';
}

export function canReleaseEscrow(ctx: EscrowParticipantContext, currentStatus: EscrowStatus): boolean {
  return (ctx.isClient || ctx.isAdmin) && currentStatus === 'DEPOSITED';
}

export function canRaiseDispute(ctx: EscrowParticipantContext, currentStatus: EscrowStatus): boolean {
  return (ctx.isClient || ctx.isFreelancer || ctx.isAdmin) && currentStatus === 'DEPOSITED';
}

export function canResolveDispute(ctx: EscrowParticipantContext, currentStatus: EscrowStatus): boolean {
  return ctx.isAdmin && currentStatus === 'DISPUTED';
}

export function canRefundEscrow(ctx: EscrowParticipantContext, currentStatus: EscrowStatus): boolean {
  return (ctx.isFreelancer || ctx.isAdmin) && (currentStatus === 'DEPOSITED' || currentStatus === 'DISPUTED');
}

export function validateEscrowDepositInput(input: {
  contractId: string;
  milestoneIndex: number;
  amount: string | number;
  clientAddress: string;
  freelancerAddress: string;
}): void {
  if (!input.contractId || input.contractId.trim().length === 0) {
    throw new DomainError('Contract ID is required', 'VALIDATION_FAILED', 400);
  }
  if (input.milestoneIndex < 0 || !Number.isInteger(input.milestoneIndex)) {
    throw new DomainError('Milestone index must be a non-negative integer', 'VALIDATION_FAILED', 400);
  }
  const numericAmount = Number(input.amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new DomainError('Escrow amount must be greater than zero', 'VALIDATION_FAILED', 400);
  }
  if (!isAddress(input.clientAddress)) {
    throw new DomainError(`Invalid client Ethereum address: ${input.clientAddress}`, 'VALIDATION_FAILED', 400);
  }
  if (!isAddress(input.freelancerAddress)) {
    throw new DomainError(`Invalid freelancer Ethereum address: ${input.freelancerAddress}`, 'VALIDATION_FAILED', 400);
  }
}
