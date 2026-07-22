import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-change-me',
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite'),
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174'],
  cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-key',
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '30d',
  cookieMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
  }
};
