export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly fields?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, { fields });
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      'NOT_FOUND',
      404
    );
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422, details);
    this.name = 'BusinessRuleError';
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }
}

export class ConcurrencyError extends AppError {
  constructor(message: string = 'Record has been modified by another user') {
    super(message, 'CONCURRENCY_ERROR', 409);
    this.name = 'ConcurrencyError';
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 'RATE_LIMIT', 429, { retryAfter });
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class ImmutableRecordError extends AppError {
  constructor(doctype: string, id: string) {
    super(
      `Cannot modify ${doctype} '${id}' - record is immutable after posting`,
      'IMMUTABLE_RECORD',
      403
    );
    this.name = 'ImmutableRecordError';
    Object.setPrototypeOf(this, ImmutableRecordError.prototype);
  }
}

export class PeriodClosedError extends AppError {
  constructor(period: string, periodName?: string) {
    super(
      periodName ? `Cannot post to closed period '${periodName}' (${period})` : `Cannot post to closed period: ${period}`,
      'PERIOD_CLOSED',
      422,
      { period, periodName }
    );
    this.name = 'PeriodClosedError';
    Object.setPrototypeOf(this, PeriodClosedError.prototype);
  }
}

export class UnbalancedEntryError extends AppError {
  constructor(debitTotal: string, creditTotal: string) {
    super(
      `Journal entry is unbalanced: Debit ${debitTotal} ≠ Credit ${creditTotal}`,
      'UNBALANCED_ENTRY',
      422,
      { debitTotal, creditTotal }
    );
    this.name = 'UnbalancedEntryError';
    Object.setPrototypeOf(this, UnbalancedEntryError.prototype);
  }
}

export class InsufficientStockError extends AppError {
  constructor(item: string, warehouse: string, requested: string, available: string) {
    super(
      `Insufficient stock for ${item} in ${warehouse}: requested ${requested}, available ${available}`,
      'INSUFFICIENT_STOCK',
      422,
      { item, warehouse, requested, available }
    );
    this.name = 'InsufficientStockError';
    Object.setPrototypeOf(this, InsufficientStockError.prototype);
  }
}

export class CreditLimitExceededError extends AppError {
  constructor(customer: string, limit: string, outstanding: string) {
    super(
      `Credit limit exceeded for ${customer}: limit ${limit}, outstanding ${outstanding}`,
      'CREDIT_LIMIT_EXCEEDED',
      422,
      { customer, limit, outstanding }
    );
    this.name = 'CreditLimitExceededError';
    Object.setPrototypeOf(this, CreditLimitExceededError.prototype);
  }
}
