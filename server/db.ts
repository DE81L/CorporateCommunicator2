import { Client } from 'pg';
import { log } from '../util/logger';

let client: Client | null = null;

export async function connectDb(): Promise<void> {
  if (!process.env.DATABASE_URL || process.env.DB_DISABLED === 'true') {
    log('⏩ DB connection skipped');
    return;
  }

  try {
    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    log('✓ DB connected');
  } catch (error) {
    log('⚠️ DB connection failed:', error);
    client = null;
  }
}

export { client };
