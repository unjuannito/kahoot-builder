import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwt.service.js';

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = JWTService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid access token' });
  }
};

export const optionalAuthMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;

  if (token) {
    try {
      const payload = JWTService.verifyAccessToken(token);
      req.user = payload;
    } catch (error) {
      // Ignore error for optional auth
    }
  }
  next();
};
