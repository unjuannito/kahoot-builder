import app from './app.js';
import { config } from './config/index.js';
import { initDB } from './db/index.js';
import { AccountDeletionService } from './services/account-deletion.service.js';
import { SessionCleanupService } from './services/session-cleanup.service.js';

const startServer = async () => {
  try {
    // Initialize Database
    initDB();
    AccountDeletionService.processDue();
    setInterval(() => AccountDeletionService.processDue(), 60 * 60 * 1000);
    SessionCleanupService.processDue();
    setInterval(() => SessionCleanupService.processDue(), 60 * 60 * 1000);
    console.log('📦 Database initialized');

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
