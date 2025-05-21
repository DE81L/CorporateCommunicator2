import { Router } from 'express';
import { db } from '../db';

const router = Router();

// ----- Wiki entries -----

// GET /api/wiki and /api/wiki/entries
router.get(['/', '/entries'], async (_req, res) => {
  const { rows } = await db!.query('SELECT * FROM wiki_entries');
  res.json(rows);
});

// GET /api/wiki/:id and /api/wiki/entries/:id
router.get(['/entries/:id', '/:id(\\d+)'], async (req, res) => {
  const entryId = +req.params.id;
  const { rows } = await db!.query('SELECT * FROM wiki_entries WHERE id = $1', [entryId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  res.json(rows[0]);
});

// POST /api/wiki and /api/wiki/entries
router.post(['/', '/entries'], async (req, res) => {
  const { title, content, categoryId } = req.body;
  const creatorId = req.session.userId;
  const { rows } = await db!.query(
    'INSERT INTO wiki_entries(title, content, category_id, creator_id, created_at) VALUES($1,$2,$3,$4,NOW()) RETURNING *',
    [title, content, categoryId, creatorId]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/wiki/:id and /api/wiki/entries/:id
router.put(['/entries/:id', '/:id(\\d+)'], async (req, res) => {
  const entryId = +req.params.id;
  const { title, content, categoryId } = req.body;
  const editorId = req.session.userId;
  const { rows } = await db!.query(
    'UPDATE wiki_entries SET title=$1, content=$2, category_id=$3, last_editor_id=$4, updated_at=NOW() WHERE id = $5 RETURNING *',
    [title, content, categoryId, editorId, entryId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  res.json(rows[0]);
});

// DELETE /api/wiki/:id and /api/wiki/entries/:id
router.delete(['/entries/:id', '/:id(\\d+)'], async (req, res) => {
  const entryId = +req.params.id;
  const { rows } = await db!.query('DELETE FROM wiki_entries WHERE id = $1 RETURNING *', [entryId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  res.json(rows[0]);
});

// ----- Wiki categories -----

// GET /api/wiki/categories
router.get('/categories', async (_req, res) => {
  const { rows } = await db!.query('SELECT * FROM wiki_categories');
  res.json(rows);
});

// GET /api/wiki/categories/:id/entries
router.get('/categories/:id/entries', async (req, res) => {
  const categoryId = +req.params.id;
  const { rows } = await db!.query('SELECT * FROM wiki_entries WHERE category_id = $1', [categoryId]);
  res.json(rows);
});

// POST /api/wiki/categories
router.post('/categories', async (req, res) => {
  const { name, description, parentId } = req.body;
  const { rows } = await db!.query(
    'INSERT INTO wiki_categories(name, description, parent_id, created_at, updated_at) VALUES($1,$2,$3,NOW(),NOW()) RETURNING *',
    [name, description, parentId]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/wiki/categories/:id
router.put('/categories/:id', async (req, res) => {
  const categoryId = +req.params.id;
  const { name, description, parentId } = req.body;
  const { rows } = await db!.query(
    'UPDATE wiki_categories SET name=$1, description=$2, parent_id=$3, updated_at=NOW() WHERE id = $4 RETURNING *',
    [name, description, parentId, categoryId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(rows[0]);
});

// DELETE /api/wiki/categories/:id
router.delete('/categories/:id', async (req, res) => {
  const categoryId = +req.params.id;
  const { rows } = await db!.query('DELETE FROM wiki_categories WHERE id = $1 RETURNING *', [categoryId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(rows[0]);
});

export default router;
