import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index.js';

const client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl
);

export const GoogleAuthService = {
  getAuthUrl(state?: string): string {
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent',
      state,
    });
  },

  async getUserInfo(code: string) {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Google authentication failed: no payload');
    }

    return {
      email: payload.email!,
      name: payload.name!,
      avatar_url: payload.picture,
      googleId: payload.sub,
    };
  },
};
