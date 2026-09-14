import { randomBytes } from 'node:crypto';
import { verifyMessage } from 'viem';
import { SignatureInvalidError } from './auth.errors';

const NONCE_EXPIRY_MINUTES = 15;

export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}

export function getNonceExpiresAt(): Date {
  return new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);
}

export function buildSiweMessage(params: {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}): string {
  const lines = [
    `${params.domain} wants you to sign in with your Ethereum account:`,
    params.address,
    '',
    params.statement,
    '',
    `URI: ${params.uri}`,
    `Version: ${params.version}`,
    `Chain ID: ${params.chainId}`,
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
    `Expiration Time: ${params.expirationTime}`,
  ];
  return lines.join('\n');
}

export async function verifySiweSignature(params: {
  address: string;
  message: string;
  signature: string;
}): Promise<boolean> {
  try {
    const isValid = await verifyMessage({
      address: params.address as `0x${string}`,
      message: params.message,
      signature: params.signature as `0x${string}`,
    });
    return isValid;
  } catch {
    return false;
  }
}

export async function requireValidSignature(params: {
  address: string;
  message: string;
  signature: string;
}): Promise<void> {
  const isValid = await verifySiweSignature(params);
  if (!isValid) {
    throw new SignatureInvalidError();
  }
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function isNonceExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function isNonceUsed(usedAt: Date | null): boolean {
  return usedAt !== null;
}
