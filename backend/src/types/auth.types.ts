export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  language_code?: string;
  is_active: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // UI helpers
  has_password?: boolean;
  is_google_linked?: boolean;
  deletion_scheduled_for?: string;
}

export interface UserConnection {
  id: string;
  user_id: string;
  provider_id: string;
  provider_user_id: string;
  provider_email?: string;
  created_at: string;
}

export interface AuthSession {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  expires_at: string;
  revoked_at?: string;
  created_at: string;
  last_used_at?: string;
  device_info?: string;
  ip_address?: string;
}

export interface AccountDeletionTask {
  id: string;
  user_id: string;
  scheduled_for: string;
  canceled_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}
