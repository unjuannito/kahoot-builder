import { randomUUID } from 'node:crypto';
import { getDB } from '../db/index.js';
import { AccountDeletionTask } from '../types/auth.types.js';

export const AccountDeletionRepository = {
  findActiveByUserId(userId: string): AccountDeletionTask | undefined {
    return getDB().prepare(`
      SELECT * FROM account_deletion_tasks
      WHERE user_id = ? AND canceled_at IS NULL AND completed_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(userId) as AccountDeletionTask | undefined;
  },

  schedule(userId: string, scheduledFor: string): AccountDeletionTask {
    const existing = this.findActiveByUserId(userId);
    if (existing) return existing;
    const id = randomUUID();
    getDB().prepare(`
      INSERT INTO account_deletion_tasks (id, user_id, scheduled_for)
      VALUES (?, ?, ?)
    `).run(id, userId, scheduledFor);
    return this.findById(id)!;
  },

  cancel(userId: string): void {
    getDB().prepare(`
      UPDATE account_deletion_tasks
      SET canceled_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND canceled_at IS NULL AND completed_at IS NULL
    `).run(userId);
  },

  findById(id: string): AccountDeletionTask | undefined {
    return getDB().prepare('SELECT * FROM account_deletion_tasks WHERE id = ?').get(id) as AccountDeletionTask | undefined;
  },

  findDue(now: string): AccountDeletionTask[] {
    return getDB().prepare(`
      SELECT * FROM account_deletion_tasks
      WHERE scheduled_for <= ? AND canceled_at IS NULL AND completed_at IS NULL
    `).all(now) as AccountDeletionTask[];
  },

  markCompleted(id: string): void {
    getDB().prepare('UPDATE account_deletion_tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },
};
