import { db } from '../db';
import { logger } from '../util/logger';

export async function seedTasksCatalog(): Promise<void> {
  if (!db) return;
  try {
    const { rows } = await db.query('SELECT COUNT(*) FROM tasks_catalog');
    const count = parseInt(rows[0].count, 10);
    if (count === 0) {
      const tasks = [
        { name: 'Не работает принтер', category: 'hardware' },
        { name: 'Нет интернета', category: 'network' },
        { name: 'Не работает проектор', category: 'hardware' },
        { name: 'другое', category: 'other' },
      ];
      for (const t of tasks) {
        await db.query(
          'INSERT INTO tasks_catalog(name, category) VALUES($1,$2)',
          [t.name, t.category]
        );
      }
      logger.info('✓ Seeded tasks_catalog');
    }
  } catch (err) {
    logger.error('Failed to seed tasks_catalog:', err);
  }
}
