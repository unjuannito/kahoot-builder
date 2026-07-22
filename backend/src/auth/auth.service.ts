import { createHash } from 'node:crypto';
import { UserRepository } from '../repositories/user.repository.js';
import { SessionRepository } from '../repositories/session.repository.js';
import { ConnectionRepository } from '../repositories/connection.repository.js';
import { PasswordService } from '../services/password.service.js';
import { JWTService } from '../services/jwt.service.js';
import { JWTPayload, User } from '../types/auth.types.js';
import { AppError } from '../types/errors.js';
import { AccountDeletionRepository } from '../repositories/account-deletion.repository.js';

export const AuthService = {
  async enrichUser(user: User): Promise<User> {
    const googleConn = ConnectionRepository.findByUserIdAndProvider(user.id, 'google');
    return {
      ...user,
      has_password: !!user.password_hash,
      is_google_linked: !!googleConn,
      deletion_scheduled_for: AccountDeletionRepository.findActiveByUserId(user.id)?.scheduled_for,
    };
  },

  async register(email: string, password: string, name: string) {
    const existingUser = UserRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('AUTH_USER_ALREADY_EXISTS', 'User already exists', 409);
    }

    const passwordHash = await PasswordService.hash(password);
    const user = UserRepository.create({ email, password_hash: passwordHash, name });
    
    return this.createSession(user);
  },

  async login(email: string, password: string) {
    const user = UserRepository.findByEmail(email);
    if (!user) {
      throw new AppError('AUTH_USER_NOT_FOUND', 'User not found', 401);
    }
    
    if (!user.password_hash) {
      throw new AppError('AUTH_NO_PASSWORD_SET', 'No password set for this user', 401);
    }

    const isValid = await PasswordService.compare(password, user.password_hash);
    if (!isValid) {
      throw new AppError('AUTH_WRONG_PASSWORD', 'Wrong password', 401);
    }

    UserRepository.updateLastLogin(user.id);
    return this.createSession(user);
  },

  async createSession(user: User) {
    const payload: JWTPayload = { userId: user.id, email: user.email };
    const accessToken = JWTService.generateAccessToken(payload);
    const refreshToken = JWTService.generateRefreshToken(payload);

    // Hash the refresh token before saving to DB for extra security
    const refreshTokenHash = this.hashToken(refreshToken);
    
    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    SessionRepository.create({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      expires_at: expiresAt.toISOString(),
    });

    const enrichedUser = await this.enrichUser(user);
    return { user: enrichedUser, accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    try {
      const payload = JWTService.verifyRefreshToken(refreshToken);
      const refreshTokenHash = this.hashToken(refreshToken);
      
      const session = SessionRepository.findByRefreshTokenHash(refreshTokenHash);
      if (!session || new Date(session.expires_at) < new Date()) {
        if (session) SessionRepository.revoke(session.id);
        throw new AppError('AUTH_SESSION_EXPIRED', 'Session expired', 401);
      }

      const user = UserRepository.findById(payload.userId);
      if (!user) throw new AppError('AUTH_USER_NOT_FOUND', 'User not found', 401);

      // Refresh token rotation: generate new tokens
      const newPayload: JWTPayload = { userId: user.id, email: user.email };
      const newAccessToken = JWTService.generateAccessToken(newPayload);
      const newRefreshToken = JWTService.generateRefreshToken(newPayload);
      const newRefreshTokenHash = this.hashToken(newRefreshToken);

      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);

      SessionRepository.updateRefreshToken(session.id, newRefreshTokenHash, newExpiresAt.toISOString());

      const enrichedUser = await this.enrichUser(user);
      return { user: enrichedUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('AUTH_INVALID_TOKEN', 'Invalid refresh token', 401);
    }
  },

  async logout(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    const session = SessionRepository.findByRefreshTokenHash(refreshTokenHash);
    if (session) {
      SessionRepository.revoke(session.id);
    }
  },

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
};
