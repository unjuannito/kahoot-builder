import { apiService } from './api.service.js';
import type { AuthUser, LoginPayload, RegisterPayload, AuthResponse } from '../../types/auth.types.js';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    return apiService.post<AuthUser>('/auth/login', payload);
  },

  async register(payload: RegisterPayload): Promise<AuthUser> {
    return apiService.post<AuthUser>('/auth/register', payload);
  },

  async logout(): Promise<void> {
    return apiService.post<void>('/auth/logout');
  },

  async refresh(): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/refresh');
  },

  async me(): Promise<AuthUser> {
    return apiService.get<AuthUser>('/auth/me');
  },

  async updateProfile(payload: { 
    name?: string; 
    language_code?: string;
  }): Promise<AuthUser> {
    return apiService.patch<AuthUser>('/auth/profile', payload);
  },

  async updatePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    return apiService.patch<void>('/auth/profile/password', payload);
  },

  async updateEmail(payload: { password: string; newEmail: string }): Promise<AuthUser> {
    return apiService.patch<AuthUser>('/auth/profile/email', payload);
  },

  async unlinkGoogle(): Promise<void> {
    return apiService.delete<void>('/auth/connections/google');
  },

  async linkGoogle(code: string): Promise<void> {
    return apiService.post<void>('/auth/connections/google', { code });
  },

  async scheduleAccountDeletion(): Promise<{ scheduled_for: string }> {
    return apiService.post<{ scheduled_for: string }>('/auth/account/deletion');
  },

  async cancelAccountDeletion(): Promise<AuthUser> {
    return apiService.delete<AuthUser>('/auth/account/deletion');
  },
};
