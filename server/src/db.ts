import { Client } from 'pg';
import { config } from './config/env';
import { logger } from '@shared/logger';

let client: Client | null = null;

export async function connectDb(): Promise<void> {
  if (!config.dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    client = new Client({
      connectionString: config.dbUrl,
      ssl: config.nodeEnv === 'production' 
        ? { rejectUnauthorized: false }
        : false
    });

    await client.connect();
    logger.info('✓ Database connected');

    // Test the connection
    const result = await client.query('SELECT NOW()');
    logger.info(`Database time: ${result.rows[0].now}`);
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export { client };
