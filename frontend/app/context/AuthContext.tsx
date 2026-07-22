import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api/auth.service.js';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth.types.js';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (payload: { 
    name?: string; 
    language_code?: string;
  }) => Promise<void>;
  updatePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
  unlinkGoogle: () => Promise<void>;
  scheduleAccountDeletion: () => Promise<void>;
  cancelAccountDeletion: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const response = await authService.refresh();
      if (response.authenticated) {
        setUser(response);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      // TypeError: Failed to fetch is expected when the backend is down
      const isExpectedError = error.message === 'Failed to fetch' || error.name === 'TypeError';
      
      if (!isExpectedError) {
        console.error('Session restoration failed:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (payload: LoginPayload) => {
    const userData = await authService.login(payload);
    setUser(userData);
  };

  const register = async (payload: RegisterPayload) => {
    const userData = await authService.register(payload);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshSession = async () => {
    try {
      const userData = await authService.refresh();
      if (userData.authenticated) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const updateProfile = async (payload: { 
    name?: string; 
    language_code?: string;
  }) => {
    const updatedUser = await authService.updateProfile(payload);
    setUser(updatedUser);
  };

  const updatePassword = async (payload: { currentPassword: string; newPassword: string }) => {
    await authService.updatePassword(payload);
    // After password change, refresh the session to get new tokens
    const userData = await authService.refresh();
    if (userData.authenticated) {
      setUser(userData);
    }
  };

  const unlinkGoogle = async () => {
    await authService.unlinkGoogle();
    const updatedUser = await authService.me();
    setUser(updatedUser);
  };

  const scheduleAccountDeletion = async () => {
    await authService.scheduleAccountDeletion();
    setUser(await authService.me());
  };

  const cancelAccountDeletion = async () => {
    setUser(await authService.cancelAccountDeletion());
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshSession, updateProfile, updatePassword, unlinkGoogle, scheduleAccountDeletion, cancelAccountDeletion }}>
      {children}
    </AuthContext.Provider>
  );
};
