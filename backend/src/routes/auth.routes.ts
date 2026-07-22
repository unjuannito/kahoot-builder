import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limiter.js';
import { validateRequest } from '../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.get('/me', authMiddleware, AuthController.me);
router.patch('/profile', authMiddleware, validateRequest(updateProfileSchema), AuthController.updateProfile);
router.patch('/profile/password', authMiddleware, validateRequest(updatePasswordSchema), AuthController.updatePassword);
router.delete('/connections/google', authMiddleware, AuthController.unlinkGoogle);
router.post('/account/deletion', authMiddleware, AuthController.scheduleAccountDeletion);
router.delete('/account/deletion', authMiddleware, AuthController.cancelAccountDeletion);

// Google OAuth
router.get('/google', AuthController.googleLogin);
router.get('/google/callback', AuthController.googleCallback);

export default router;
