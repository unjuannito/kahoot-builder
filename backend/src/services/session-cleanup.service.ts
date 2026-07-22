import { getDB } from '../db/index.js';

export const SessionCleanupService = {
  processDue() {
    const db = getDB();
    const now = new Date().toISOString();
    const result = db.prepare('DELETE FROM sessions WHERE expires_at IS NOT NULL AND expires_at <= ?').run(now);
    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} expired session(s)`);
    }
  },
};
