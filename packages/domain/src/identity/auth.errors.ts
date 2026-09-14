export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password.', 'UNAUTHENTICATED', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailAlreadyExistsError extends DomainError {
  constructor() {
    super('An account with this email already exists.', 'CONFLICT', 409);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class TokenExpiredError extends DomainError {
  constructor() {
    super('Token has expired.', 'VALIDATION_FAILED', 400);
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends DomainError {
  constructor() {
    super('Token is invalid or has already been used.', 'VALIDATION_FAILED', 400);
    this.name = 'TokenInvalidError';
  }
}

export class SignatureInvalidError extends DomainError {
  constructor() {
    super('Wallet signature verification failed.', 'VALIDATION_FAILED', 400);
    this.name = 'SignatureInvalidError';
  }
}

export class AccountSuspendedError extends DomainError {
  constructor() {
    super('Account is suspended.', 'FORBIDDEN', 403);
    this.name = 'AccountSuspendedError';
  }
}

export class AccountClosedError extends DomainError {
  constructor() {
    super('Account is closed.', 'FORBIDDEN', 403);
    this.name = 'AccountClosedError';
  }
}

export class UnauthenticatedError extends DomainError {
  constructor() {
    super('Authentication required.', 'UNAUTHENTICATED', 401);
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitedError extends DomainError {
  constructor() {
    super('Too many requests. Please try again later.', 'RATE_LIMITED', 429);
    this.name = 'RateLimitedError';
  }
}
