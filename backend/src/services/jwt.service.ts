import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JWTPayload } from '../types/auth.types.js';

export const JWTService = {
  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.accessTokenExpiresIn as any
    });
  },

  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.refreshTokenExpiresIn as any
    });
  },

  verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  },

  verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, config.jwtRefreshSecret) as JWTPayload;
  }
};
