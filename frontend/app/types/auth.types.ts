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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  language_code?: string;
  has_password?: boolean;
  authenticated?: boolean;
  is_google_linked?: boolean;
  deletion_scheduled_for?: string;
}

export interface AuthResponse extends AuthUser {
  authenticated?: boolean;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  name: string;
}
