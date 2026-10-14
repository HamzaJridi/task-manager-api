/**
 * 📌 Key concept — Custom error hierarchy for HTTP APIs.
 * `AppError` extends the built-in `Error` and adds a `statusCode`, so any
 * "expected" failure (validation, not found, auth, etc.) can be thrown as
 * a typed object that already knows which HTTP status it maps to.
 *
 * The error-handling middleware (middlewares/error.middleware.ts) checks
 * `err instanceof AppError` and uses `err.statusCode` + `err.message`
 * directly — controllers never need to call `res.status(...).json(...)`
 * for these cases, they just `throw new NotFoundError('...')`.
 *
 * Subclassing (`extends AppError`) lets each error type hardcode its own
 * status code via `super(message, code)`, while still being catchable
 * generically as `AppError` upstream.
 */
class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

class InternalServerError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) { super(message, 503); }
}

export { AppError, BadRequestError, NotFoundError, InternalServerError, UnauthorizedError, ValidationError, ConflictError, ForbiddenError };
