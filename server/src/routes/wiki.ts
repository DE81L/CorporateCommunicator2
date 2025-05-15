// C:\Users\DE81L\Downloads\CCNew\server\src\routes\wiki.ts
import { Router } from 'express';
// import { db } from '../db'; // или client
import { logger } from '../util/logger';

const router = Router();

// GET /api/wiki/entries
router.get('/entries', async (req, res) => {
  try {
    // Здесь должна быть логика получения записей wiki из БД
    // const { rows } = await db.query('SELECT * FROM wiki_entries');
    logger.info('Запрос /api/wiki/entries получен');
    res.json([
      // Пример данных
      // { id: 1, title: 'Entry 1', content: 'Content 1', categoryId: 1, createdAt: new Date(), updatedAt: new Date(), creatorId: 1, lastEditorId: 1 },
    ]);
  } catch (error) {
    logger.error('Ошибка при получении записей wiki:', error);
    res.status(500).json({ message: 'Ошибка при получении записей wiki' });
  }
});

// GET /api/wiki/categories
router.get('/categories', async (req, res) => {
  try {
    // Здесь должна быть логика получения категорий wiki из БД
    // const { rows } = await db.query('SELECT * FROM wiki_categories');
    logger.info('Запрос /api/wiki/categories получен');
    res.json([
      // Пример данных
      // { id: 1, name: 'Category 1', description: 'Desc 1', parentId: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
  } catch (error) {
    logger.error('Ошибка при получении категорий wiki:', error);
    res.status(500).json({ message: 'Ошибка при получении категорий wiki' });
  }
});

// Другие маршруты для wiki (POST, PUT, DELETE) по необходимости

export default router;