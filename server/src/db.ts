import { Client } from 'pg';
import { logger } from '@shared/logger';

let client: Client | null = null;

export async function connectDb(): Promise<void> {
  try {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
    });
    await client.connect();
    logger.info('✓ Database connected');
  } catch (error) {
    logger.info('⚠️ Database connection failed:', error);
    client = null;
    throw error;
  }
}

export { client };
