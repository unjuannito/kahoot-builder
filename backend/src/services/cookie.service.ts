import { Response } from 'express';
import { config } from '../config/index.js';

// Common cookie options for consistency
const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/', // Always set path to root to ensure cookies are available everywhere
  ...(maxAge !== undefined && { maxAge })
});

export const CookieService = {
  setAccessToken(res: Response, token: string): void {
    res.cookie('access_token', token, getCookieOptions(15 * 60 * 1000)); // 15 minutes
  },

  setRefreshToken(res: Response, token: string): void {
    res.cookie('refresh_token', token, getCookieOptions(config.cookieMaxAge));
  },

  clearAuthCookies(res: Response): void {
    // When clearing cookies, use exactly the same options as when setting them!
    res.clearCookie('access_token', getCookieOptions());
    res.clearCookie('refresh_token', getCookieOptions());
  }
};
