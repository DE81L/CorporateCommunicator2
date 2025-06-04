import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { logger } from './logger';

/**
 * Delete message records older than 30 days and ensure
 * the table never grows beyond 1000 rows. Also removes
 * any associated upload files.
 */
export async function cleanupMessages(): Promise<void> {
  if (!db) return;
  try {
    const deletedOld = await db.query<{ id: number }>(
      `DELETE FROM messages
       WHERE "timestamp" < NOW() - INTERVAL '30 days'
       RETURNING id`
    );
    await removeFiles(deletedOld.rows.map((r) => r.id));

    const { rows } = await db.query<{ count: string }>('SELECT COUNT(*) FROM messages');
    const count = Number(rows[0]?.count ?? 0);
    if (count > 1000) {
      const excess = count - 1000;
      const deleted = await db.query<{ id: number }>(
        `DELETE FROM messages
         WHERE id IN (
           SELECT id FROM messages ORDER BY "timestamp" ASC LIMIT $1
         ) RETURNING id`,
        [excess]
      );
      await removeFiles(deleted.rows.map((r) => r.id));
    }
  } catch (err) {
    logger.error('Message cleanup failed:', err);
  }
}

export function scheduleMessageCleanup(): void {
  // run immediately and then every 24 hours
  cleanupMessages().catch((err) => logger.error('Initial cleanup error:', err));
  setInterval(() => {
    cleanupMessages().catch((err) => logger.error('Scheduled cleanup error:', err));
  }, 24 * 60 * 60 * 1000);
}

async function removeFiles(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const dir = path.join(process.cwd(), 'uploads');
    const files = await fs.readdir(dir).catch(() => []);
    const idSet = new Set(ids.map(String));
    await Promise.all(
      files
        .filter((f) => {
          const match = f.match(/^(\d+)\./);
          return match && idSet.has(match[1]);
        })
        .map((f) => fs.unlink(path.join(dir, f)).catch(() => {}))
    );
  } catch {
    /* ignore file errors */
  }
}

