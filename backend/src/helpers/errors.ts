import type { DatabaseError } from "pg";

// generic error
export class AppError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause });
  }
}

// category-level error
export class RepositoryError extends AppError {
  constructor(cause: DatabaseError, message?: string) {
    super(message ?? cause.message, cause);
  }
}

export class TransactionError extends AppError {
  constructor(cause: DatabaseError, message?: string) {
    super(message ?? cause.message, cause);
  }
}

export class ConstraintError extends AppError {
  constructor(cause: DatabaseError, message?: string) {
    super(message ?? cause.message, cause);
  }
}

export class DbConnectionError extends AppError {
  constructor(cause: DatabaseError, message?: string) {
    super(message ?? cause.message, cause);
  }
}

// application-level errors
export class AlreadyExistsError extends AppError {
  constructor(
    public readonly resource: string,
    public readonly field: string,
    cause?: ConstraintError,
    public readonly status: number = 400,
  ) {
    super(`A ${resource} with this ${field} already exists.`, cause);
  }
}

export class NotFoundError extends AppError {
  constructor(
    public readonly resource: string,
    cause?: ConstraintError,
    public readonly status: number = 404,
  ) {
    super(`The specified ${resource} does not exist.`, cause);
  }
}

export class NonNegativeValueError extends AppError {
  constructor(cause?: ConstraintError) {
    super("The value must be greater than or equal to zero.", cause);
  }
}

export class PositiveValueError extends AppError {
  constructor(cause?: ConstraintError) {
    super("The value must be greater than zero.", cause);
  }
}

export class PromoCodeExhaustedError extends AppError {
  constructor(cause?: ConstraintError) {
    super("The promo code has no uses remaining.", cause);
  }
}

export class IncorrectPasswordError extends AppError {
  constructor() {
    super("The old password is incorrect.");
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Email or password is incorrect");
  }
}
