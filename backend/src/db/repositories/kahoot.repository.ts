import { randomUUID } from 'node:crypto';
import { getDB } from '../index.js';
import { CreateQuestionInput, KahootSession, Question, SessionUser, SessionVisibility, UpdateQuestionInput } from '../../types/kahoot.types.js';

const mapSessionUser = (row: any): SessionUser => ({
  ...row,
  is_owner: Boolean(row.is_owner),
});

const mapQuestion = (row: any): Question => ({
  ...row,
  user_name: row.user_name,
});

export const KahootRepository = {
  createSession(code: string, ownerUserId?: string): KahootSession {
    const id = randomUUID();
    const db = getDB();
    db.prepare('INSERT INTO sessions (id, code, visibility) VALUES (?, ?, ?)').run(id, code, 'all_questions');
    
    if (ownerUserId) {
      const sessionUserId = randomUUID();
      db.prepare(`
        INSERT INTO session_users (id, session_id, user_id, is_owner)
        VALUES (?, ?, ?, ?)
      `).run(sessionUserId, id, ownerUserId, 1);
    }
    
    return this.findSessionById(id)!;
  },

  updateSessionVisibility(sessionId: string, visibility: SessionVisibility): KahootSession {
    const db = getDB();
    db.prepare('UPDATE sessions SET visibility = ? WHERE id = ?').run(visibility, sessionId);
    return this.findSessionById(sessionId)!;
  },

  closeSession(sessionId: string): KahootSession {
    getDB().prepare('UPDATE sessions SET closed_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);
    return this.findSessionById(sessionId)!;
  },

  reopenSession(sessionId: string): KahootSession {
    getDB().prepare('UPDATE sessions SET closed_at = NULL WHERE id = ?').run(sessionId);
    return this.findSessionById(sessionId)!;
  },

  findSessionById(id: string): KahootSession | undefined {
    return getDB().prepare('SELECT * FROM sessions WHERE id = ?').get(id) as KahootSession | undefined;
  },

  findSessionByCode(code: string): KahootSession | undefined {
    return getDB().prepare('SELECT * FROM sessions WHERE code = ?').get(code) as KahootSession | undefined;
  },

  createQuestion(input: CreateQuestionInput): Question {
    const id = randomUUID();
    getDB().prepare(`INSERT INTO questions
      (id, session_id, user_id, question, option1, option2, option3, option4, time, correct)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, input.session_id, input.user_id, input.question, input.option1, input.option2, input.option3,
        input.option4, input.time, input.correct);
    return this.findQuestionById(id)!;
  },

  updateQuestion(id: string, input: UpdateQuestionInput): Question | undefined {
    const db = getDB();
    db.prepare(`UPDATE questions
      SET question = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, time = ?, correct = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`)
      .run(input.question, input.option1, input.option2, input.option3, input.option4, input.time, input.correct, id);
    return this.findQuestionById(id);
  },

  deleteQuestion(id: string): void {
    const db = getDB();
    db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  },

  findQuestionById(id: string): Question | undefined {
    const row = getDB().prepare(`
      SELECT q.*, u.name as user_name
      FROM questions q
      JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `).get(id);
    return row ? mapQuestion(row) : undefined;
  },

  findQuestionsBySession(sessionId: string, userId?: string): Question[] {
    const db = getDB();
    const query = `
      SELECT q.*, u.name as user_name
      FROM questions q
      JOIN users u ON q.user_id = u.id
      WHERE q.session_id = ?
      ORDER BY q.created_at, q.id
    `;
    
    return db.prepare(query).all(sessionId).map(mapQuestion);
  },

  getActiveUsers(sessionId: string): SessionUser[] {
    const db = getDB();
    const rows = db.prepare('SELECT * FROM session_users WHERE session_id = ? AND left_at IS NULL').all(sessionId);
    return rows.map(mapSessionUser);
  },

  setSessionExpiration(sessionId: string, days: number = 7): void {
    const db = getDB();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').run(expirationDate.toISOString(), sessionId);
  },

  clearSessionExpiration(sessionId: string): void {
    const db = getDB();
    db.prepare('UPDATE sessions SET expires_at = NULL WHERE id = ?').run(sessionId);
  },

  joinSession(sessionId: string, userId: string, isOwner: boolean = false): SessionUser {
    const db = getDB();
    const existing = this.findSessionUser(sessionId, userId);
    if (existing) {
      // If already joined, reset left_at and clear expiration
      if (existing.left_at) {
        const shouldBecomeOwner = this.getActiveUsers(sessionId).every((user) => !user.is_owner);
        db.prepare('UPDATE session_users SET left_at = NULL, is_owner = ? WHERE id = ?').run(shouldBecomeOwner ? 1 : existing.is_owner ? 1 : 0, existing.id);
        this.clearSessionExpiration(sessionId);
        return this.findSessionUserById(existing.id)!;
      }
      return existing;
    }
    const id = randomUUID();
    const hasActiveOwner = this.getActiveUsers(sessionId).some((user) => user.is_owner);
    db.prepare(`
      INSERT INTO session_users (id, session_id, user_id, is_owner)
      VALUES (?, ?, ?, ?)
    `).run(id, sessionId, userId, isOwner || !hasActiveOwner ? 1 : 0);
    // Clear expiration if someone joins
    this.clearSessionExpiration(sessionId);
    return this.findSessionUserById(id)!;
  },

  leaveSession(sessionId: string, userId: string): void {
    const db = getDB();
    const leavingUser = this.findSessionUser(sessionId, userId);
    if (!leavingUser || leavingUser.left_at) return;
    db.prepare('UPDATE session_users SET left_at = CURRENT_TIMESTAMP, is_owner = 0 WHERE session_id = ? AND user_id = ?').run(sessionId, userId);

    const activeUsers = this.getActiveUsers(sessionId);
    if (leavingUser.is_owner && activeUsers.length > 0) {
      const nextOwner = activeUsers.sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0];
      db.prepare('UPDATE session_users SET is_owner = 1 WHERE id = ?').run(nextOwner.id);
      this.clearSessionExpiration(sessionId);
    } else if (activeUsers.length === 0) {
      this.setSessionExpiration(sessionId);
    } else {
      this.clearSessionExpiration(sessionId);
    }
  },

  findSessionUser(sessionId: string, userId: string): SessionUser | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM session_users WHERE session_id = ? AND user_id = ?').get(sessionId, userId);
    return row ? mapSessionUser(row) : undefined;
  },

  findSessionUserById(id: string): SessionUser | undefined {
    const db = getDB();
    const row = db.prepare('SELECT * FROM session_users WHERE id = ?').get(id);
    return row ? mapSessionUser(row) : undefined;
  },

  findSessionUsersBySession(sessionId: string): SessionUser[] {
    const db = getDB();
    const rows = db.prepare('SELECT * FROM session_users WHERE session_id = ?').all(sessionId);
    return rows.map(mapSessionUser);
  },

  findSessionUsersByUser(userId: string): SessionUser[] {
    const db = getDB();
    const rows = db.prepare('SELECT * FROM session_users WHERE user_id = ?').all(userId);
    return rows.map(mapSessionUser);
  },

  findSessionsByUser(userId: string) {
    return getDB().prepare(`SELECT s.*, su.is_owner, su.joined_at FROM sessions s JOIN session_users su ON su.session_id = s.id WHERE su.user_id = ? AND su.left_at IS NULL ORDER BY s.created_at DESC`).all(userId);
  },
};
