import { db } from './db';
import { logger } from './util/logger';

export async function ensureIsExplanationColumn(): Promise<void> {
  if (!db) throw new Error('Database not connected');
  try {
    const result = await db.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'groups' AND column_name = 'is_explanation'
       ) AS exists`
    );
    if (!result.rows[0].exists) {
      logger.info('Adding is_explanation column to groups table');
      await db.query('ALTER TABLE groups ADD COLUMN is_explanation integer DEFAULT 0');
      logger.info('Added is_explanation column');
    }
  } catch (err) {
    logger.error('Failed to ensure is_explanation column:', err);
    throw err;
  }
}
