import { Client } from 'pg';
import { config } from './config/env'; // source [1344]
import { logger } from '@shared/logger'; // source [1344]

let pgClient: Client | null = null; // Переименовал, чтобы избежать конфликта имен

export async function connectDb(): Promise<void> {
  if (!config.dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    pgClient = new Client({ // Используем переименованную переменную
      connectionString: config.dbUrl,
      ssl: config.nodeEnv === 'production' 
        ? { rejectUnauthorized: false }
        : false
    });
    await pgClient.connect();
    logger.info('✓ Database connected');

    const result = await pgClient.query('SELECT NOW()');
    logger.info(`Database time: ${result.rows[0].now}`);
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export { pgClient as db };
