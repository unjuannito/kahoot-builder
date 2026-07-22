import { randomUUID } from 'node:crypto';
import { getDB } from '../db/index.js';
import { UserConnection } from '../types/auth.types.js';

export const ConnectionRepository = {
  create(connection: Omit<UserConnection, 'id' | 'created_at'>): UserConnection {
    const db = getDB();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO user_connections (id, user_id, provider_id, provider_user_id, provider_email)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      connection.user_id,
      connection.provider_id,
      connection.provider_user_id,
      connection.provider_email || null
    );

    return this.findById(id)!;
  },

  findById(id: string): UserConnection | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM user_connections WHERE id = ?').get(id);
    return row as UserConnection | undefined;
  },

  findByProvider(providerId: string, providerUserId: string): UserConnection | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM user_connections WHERE provider_id = ? AND provider_user_id = ?')
      .get(providerId, providerUserId);
    return row as UserConnection | undefined;
  },

  findByUserIdAndProvider(userId: string, providerId: string): UserConnection | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM user_connections WHERE user_id = ? AND provider_id = ?')
      .get(userId, providerId);
    return row as UserConnection | undefined;
  },

  findByUserId(userId: string): UserConnection[] {
    const db = getDB();
    const rows = db.prepare('SELECT * FROM user_connections WHERE user_id = ?').all(userId);
    return rows as UserConnection[];
  },

  delete(userId: string, providerId: string): void {
    const db = getDB();
    db.prepare('DELETE FROM user_connections WHERE user_id = ? AND provider_id = ?').run(userId, providerId);
  }
};
