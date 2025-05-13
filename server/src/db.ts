import { Client } from 'pg';
import { log } from '@shared/logger';

let client: Client | null = null;

export async function connectDb(): Promise<void> {
  try {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
    });
    await client.connect();
    log('✓ Database connected');
  } catch (error) {
    log('⚠️ Database connection failed:', error);
    client = null;
    throw error;
  }
}

export { client };
