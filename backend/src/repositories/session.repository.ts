import { randomUUID } from 'node:crypto';
import { getDB } from '../db/index.js';
import { AuthSession } from '../types/auth.types.js';

export const SessionRepository = {
  create(session: Omit<AuthSession, 'id' | 'created_at' | 'revoked_at' | 'last_used_at'>): AuthSession {
    const db = getDB();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO auth_sessions (id, user_id, refresh_token_hash, expires_at, device_info, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      session.user_id,
      session.refresh_token_hash,
      session.expires_at,
      session.device_info || null,
      session.ip_address || null
    );

    return this.findById(id)!;
  },

  findById(id: string): AuthSession | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM auth_sessions WHERE id = ?').get(id);
    return row as AuthSession | undefined;
  },

  findByRefreshTokenHash(hash: string): AuthSession | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM auth_sessions WHERE refresh_token_hash = ? AND revoked_at IS NULL').get(hash);
    return row as AuthSession | undefined;
  },

  revoke(id: string): void {
    const db = getDB();
    db.prepare('UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  revokeAllForUser(userId: string): void {
    const db = getDB();
    db.prepare('UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL').run(userId);
  },

  updateLastUsed(id: string): void {
    const db = getDB();
    db.prepare('UPDATE auth_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  updateRefreshToken(id: string, newHash: string, newExpiresAt: string): void {
    const db = getDB();
    db.prepare(`
      UPDATE auth_sessions 
      SET refresh_token_hash = ?, expires_at = ?, last_used_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newHash, newExpiresAt, id);
  }
};
