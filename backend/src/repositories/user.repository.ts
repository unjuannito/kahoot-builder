import { randomUUID } from 'node:crypto';
import { getDB } from '../db/index.js';
import { User } from '../types/auth.types.js';

const mapUser = (row: any): User => ({
  ...row,
  is_active: Boolean(row.is_active),
});

export const UserRepository = {
  findByEmail(email: string): User | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL').get(email);
    return row ? mapUser(row) : undefined;
  },

  findById(id: string): User | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').get(id);
    return row ? mapUser(row) : undefined;
  },

  create(user: Partial<User> & { email: string; name: string }): User {
    const db = getDB();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, language_code) 
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id, 
      user.email, 
      user.password_hash || null,
      user.name, 
      user.language_code || 'es'
    );
    
    return this.findById(id)!;
  },

  update(id: string, data: Partial<User>): User {
    const db = getDB();
    const fields = Object.keys(data);
    if (fields.length === 0) return this.findById(id)!;

    const sets = fields.map(f => `${f} = ?`).join(', ');
    const values = Object.values(data);

    db.prepare(`UPDATE users SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...values, id);

    return this.findById(id)!;
  },

  updateLastLogin(id: string): void {
    const db = getDB();
    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  deletePermanently(id: string): void {
    const db = getDB();
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM user_connections WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });
    transaction();
  }
};
