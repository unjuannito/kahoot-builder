export type ErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_USER_NOT_FOUND'
  | 'AUTH_USER_ALREADY_EXISTS'
  | 'AUTH_INVALID_TOKEN'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_GOOGLE_AUTH_FAILED'
  | 'AUTH_GOOGLE_ALREADY_LINKED'
  | 'AUTH_GOOGLE_ALREADY_LINKED_OTHER'
  | 'AUTH_GOOGLE_ALREADY_LINKED_SELF'
  | 'AUTH_CANNOT_UNLINK_ONLY_ACCESS'
  | 'AUTH_NO_PASSWORD_SET'
  | 'AUTH_WRONG_PASSWORD'
  | 'AUTH_EMAIL_ALREADY_USED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;

  constructor(code: ErrorCode, message?: string, status?: number) {
    super(message || code);
    this.name = 'AppError';
    this.code = code;
    this.status = status || 400;

    // Ensure proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}
