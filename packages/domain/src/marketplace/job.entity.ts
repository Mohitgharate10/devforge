import { DomainError } from '../identity/auth.errors';

export class InvalidBudgetError extends DomainError {
  constructor(message = 'Minimum budget cannot exceed maximum budget.') {
    super(message, 'VALIDATION_FAILED', 400);
    this.name = 'InvalidBudgetError';
  }
}

export class InvalidJobTitleError extends DomainError {
  constructor(message = 'Job title must be between 5 and 150 characters.') {
    super(message, 'VALIDATION_FAILED', 400);
    this.name = 'InvalidJobTitleError';
  }
}

export class InvalidJobDescriptionError extends DomainError {
  constructor(message = 'Job description must be at least 20 characters.') {
    super(message, 'VALIDATION_FAILED', 400);
    this.name = 'InvalidJobDescriptionError';
  }
}

const SUPPORTED_CURRENCIES = ['USD', 'USDC', 'ETH', 'DOT', 'EUR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function normalizeCurrency(currency?: string | null): string {
  if (!currency) return 'USD';
  const upper = currency.trim().toUpperCase();
  if (SUPPORTED_CURRENCIES.includes(upper as SupportedCurrency)) {
    return upper;
  }
  return 'USD';
}

export function validateBudget(
  budgetMin?: number | bigint | null,
  budgetMax?: number | bigint | null,
): void {
  if (budgetMin !== undefined && budgetMin !== null && budgetMin < 0) {
    throw new InvalidBudgetError('Minimum budget cannot be negative.');
  }
  if (budgetMax !== undefined && budgetMax !== null && budgetMax < 0) {
    throw new InvalidBudgetError('Maximum budget cannot be negative.');
  }
  if (
    budgetMin !== undefined &&
    budgetMin !== null &&
    budgetMax !== undefined &&
    budgetMax !== null
  ) {
    const min = typeof budgetMin === 'bigint' ? Number(budgetMin) : budgetMin;
    const max = typeof budgetMax === 'bigint' ? Number(budgetMax) : budgetMax;
    if (min > max) {
      throw new InvalidBudgetError('Minimum budget cannot exceed maximum budget.');
    }
  }
}

export function validateJobTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length < 5 || trimmed.length > 150) {
    throw new InvalidJobTitleError();
  }
  return trimmed;
}

export function validateJobDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length < 20) {
    throw new InvalidJobDescriptionError();
  }
  return trimmed;
}
