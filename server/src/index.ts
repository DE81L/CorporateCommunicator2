import './config/env';
import { createApp } from './app';
import { connectDb } from './db';
import { config } from './config/env';
import { logger } from '@shared/logger';

async function main() {
  try {
    await connectDb();
    
    const app = createApp();
    app.listen(config.port, () => {
      logger.info(`🚀 API ready → http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();