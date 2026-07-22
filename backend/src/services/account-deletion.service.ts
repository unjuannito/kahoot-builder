import { AccountDeletionRepository } from '../repositories/account-deletion.repository.js';
import { UserRepository } from '../repositories/user.repository.js';

const DELETION_DELAY_DAYS = 30;

export const AccountDeletionService = {
  schedule(userId: string) {
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + DELETION_DELAY_DAYS);
    return AccountDeletionRepository.schedule(userId, scheduledFor.toISOString());
  },

  cancel(userId: string): void {
    AccountDeletionRepository.cancel(userId);
  },

  processDue(): void {
    for (const task of AccountDeletionRepository.findDue(new Date().toISOString())) {
      UserRepository.deletePermanently(task.user_id);
      AccountDeletionRepository.markCompleted(task.id);
    }
  },
};
