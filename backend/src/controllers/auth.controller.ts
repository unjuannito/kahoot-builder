import { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { CookieService } from '../services/cookie.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ConnectionRepository } from '../repositories/connection.repository.js';
import { GoogleAuthService } from '../services/google-auth.service.js';
import { JWTService } from '../services/jwt.service.js';
import { config } from '../config/index.js';
import { PasswordService } from '../services/password.service.js';
import { AccountDeletionService } from '../services/account-deletion.service.js';

const safeUser = (user: any) => {
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.register(email, password, name);

      CookieService.setAccessToken(res, accessToken);
      CookieService.setRefreshToken(res, refreshToken);

      res.status(201).json(safeUser(user));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login(email, password);

      CookieService.setAccessToken(res, accessToken);
      CookieService.setRefreshToken(res, refreshToken);

      res.json(safeUser(user));
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  },

  async logout(req: any, res: Response) {
    try {
      const refreshToken = req.cookies.refresh_token;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      CookieService.clearAuthCookies(res);
      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refresh_token;
      if (!refreshToken) {
        return res.json({ authenticated: false });
      }

      const { user, accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(refreshToken);

      CookieService.setAccessToken(res, accessToken);
      CookieService.setRefreshToken(res, newRefreshToken);

      res.json({ ...safeUser(user), authenticated: true });
    } catch (error: any) {
      CookieService.clearAuthCookies(res);
      res.json({ authenticated: false });
    }
  },

  async me(req: any, res: Response) {
    const user = UserRepository.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(await AuthService.enrichUser(user)));
  },

  async updateProfile(req: any, res: Response) {
    const user = UserRepository.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updatedUser = UserRepository.update(user.id, { name: req.body.name.trim() });
    res.json(safeUser(await AuthService.enrichUser(updatedUser)));
  },

  async updatePassword(req: any, res: Response) {
    const user = UserRepository.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { currentPassword, newPassword } = req.body;

    if (user.password_hash) {
      if (!currentPassword || !(await PasswordService.compare(currentPassword, user.password_hash))) {
        return res.status(401).json({ error: 'Wrong password', code: 'AUTH_WRONG_PASSWORD' });
      }
    }

    UserRepository.update(user.id, { password_hash: await PasswordService.hash(newPassword) });
    res.json({ message: 'Password updated successfully' });
  },

  async unlinkGoogle(req: any, res: Response) {
    const user = UserRepository.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Set a password before unlinking Google', code: 'AUTH_CANNOT_UNLINK_ONLY_ACCESS' });
    }
    ConnectionRepository.delete(user.id, 'google');
    res.json({ message: 'Google account unlinked' });
  },

  async scheduleAccountDeletion(req: any, res: Response) {
    const user = UserRepository.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const task = AccountDeletionService.schedule(user.id);
    res.json({ scheduled_for: task.scheduled_for });
  },

  async cancelAccountDeletion(req: any, res: Response) {
    AccountDeletionService.cancel(req.user.userId);
    const user = UserRepository.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(await AuthService.enrichUser(user)));
  },

  async googleLogin(req: Request, res: Response) {
    const { from } = req.query;
    const url = GoogleAuthService.getAuthUrl(from as string);
    res.redirect(url);
  },

  async googleCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;
      if (!code) throw new Error('No code provided');

      const userInfo = await GoogleAuthService.getUserInfo(code as string);

      let redirectBase = state as string;
      if (!redirectBase) {
        redirectBase = Array.isArray(config.corsOrigin) ? config.corsOrigin[0] : config.corsOrigin;
      }

      const cleanBase = redirectBase.endsWith('/') ? redirectBase.slice(0, -1) : redirectBase;

      // Handle Linking if already authenticated (though we now have /connections/google, 
      // the callback might still be used if we don't change the frontend flow)
      const accessToken = req.cookies.access_token;
      if (accessToken) {
        try {
          const payload = JWTService.verifyAccessToken(accessToken);
          const currentUser = UserRepository.findById(payload.userId);

          if (currentUser) {
            const existingConn = ConnectionRepository.findByProvider('google', userInfo.googleId);
            if (existingConn && existingConn.user_id !== currentUser.id) {
              return res.redirect(`${cleanBase}/profile?error=google_already_linked`);
            }

            if (!existingConn) {
              ConnectionRepository.create({
                user_id: currentUser.id,
                provider_id: 'google',
                provider_user_id: userInfo.googleId,
                provider_email: userInfo.email
              });
            }
            if (req.query.state && (req.query.state as string).includes('popup=true')) {
              return res.send('<script>window.opener.postMessage({ type: "GOOGLE_LINK_SUCCESS" }, "*"); window.close();</script>');
            }
            return res.redirect(`${cleanBase}/profile?success=google_linked`);
          }
        } catch (e) {
          // Token invalid, proceed to login flow
        }
      }

      // Login/Register flow
      let connection = ConnectionRepository.findByProvider('google', userInfo.googleId);
      let user;

      if (connection) {
        user = UserRepository.findById(connection.user_id);
      } else {
        // Fallback to email for legacy or first time
        user = UserRepository.findByEmail(userInfo.email);
        if (user) {
          // Link existing user
          ConnectionRepository.create({
            user_id: user.id,
            provider_id: 'google',
            provider_user_id: userInfo.googleId,
            provider_email: userInfo.email
          });
        } else {
          // Register new user
          user = UserRepository.create({
            email: userInfo.email,
            name: userInfo.name,
          });
          ConnectionRepository.create({
            user_id: user.id,
            provider_id: 'google',
            provider_user_id: userInfo.googleId,
            provider_email: userInfo.email
          });
        }
      }

      const { accessToken: newAccessToken, refreshToken } = await AuthService.createSession(user!);
      CookieService.setAccessToken(res, newAccessToken);
      CookieService.setRefreshToken(res, refreshToken);

      const isPopup = req.query.state && (req.query.state as string).includes('popup=true');
      if (isPopup) {
        return res.send(`
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
        `);
      }

      res.redirect(cleanBase || '/');
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      const { state } = req.query;
      let redirectBase = state as string;
      if (!redirectBase) {
        redirectBase = Array.isArray(config.corsOrigin) ? config.corsOrigin[0] : config.corsOrigin;
      }
      const cleanBase = redirectBase.endsWith('/') ? redirectBase.slice(0, -1) : redirectBase;

      const isPopup = req.query.state && (req.query.state as string).includes('popup=true');
      if (isPopup) {
        return res.send(`
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error.message}' }, '*');
            window.close();
          </script>
        `);
      }

      res.redirect(`${cleanBase}/login?error=google_auth_failed`);
    }
  }
};
