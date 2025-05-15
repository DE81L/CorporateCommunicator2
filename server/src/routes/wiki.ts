// C:\Users\DE81L\Downloads\CCNew\server\src\routes\wiki.ts
import { Router } from 'express';
// import { db } from '../db'; // или client
import { logger } from '../util/logger';
import { db } from '../db'; // Импортируем db из db.ts

const router = Router();

// GET /api/wiki/entries
router.get('/entries', async (req, res) => {
  const { rows } = await db!.query('SELECT * FROM wiki_entries');
  res.json(rows);
});

// GET /api/wiki/categories – список категорий
router.get('/categories', async (req, res) => {
  const { rows } = await db!.query('SELECT * FROM wiki_categories');
  res.json(rows);
});

// POST /api/wiki/entries – создать новую запись
router.post('/entries', async (req, res) => {
  const { title, content, categoryId } = req.body;
  const creatorId = req.session.userId;
  const { rows } = await db!.query(
    'INSERT INTO wiki_entries(title, content, category_id, creator_id, created_at) VALUES($1,$2,$3,$4,NOW()) RETURNING *',
    [title, content, categoryId, creatorId]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/wiki/entries/:id – обновить существующую запись
router.put('/entries/:id', async (req, res) => {
  const entryId = +req.params.id;
  const { title, content, categoryId } = req.body;
  const editorId = req.session.userId;
  const { rows } = await db!.query(
    'UPDATE wiki_entries SET title=$1, content=$2, category_id=$3, last_editor_id=$4, updated_at=NOW() WHERE id = $5 RETURNING *',
    [title, content, categoryId, editorId, entryId]
  );
  res.json(rows[0]);
});
// Другие маршруты для wiki (POST, PUT, DELETE) по необходимости

export default router;