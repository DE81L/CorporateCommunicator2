import { Router } from 'express';
import { db } from '../db';

const router = Router();

// ----- Wiki entries -----

// GET /api/wiki and /api/wiki/entries
router.get(['/', '/entries'], async (_req, res) => {
  const { rows } = await db!.query('SELECT * FROM wiki_entries');
  const sanitized = rows.map((r) => ({ ...r, title: r.title ?? 'Untitled' }));
  res.json(sanitized);
});

// GET /api/wiki/:id and /api/wiki/entries/:id
router.get(['/entries/:id', '/:id(\\d+)'], async (req, res) => {
  const entryId = +req.params.id;
  const { rows } = await db!.query('SELECT * FROM wiki_entries WHERE id = $1', [entryId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  const entry = rows[0];
  res.json({ ...entry, title: entry.title ?? 'Untitled' });
});

// POST /api/wiki and /api/wiki/entries
router.post(['/', '/entries'], async (req, res) => {
  let { title, content, category } = req.body;
  if (!title || !title.trim()) {
    title = 'Untitled';
  }
  const creatorId = req.session.userId;
  const { rows } = await db!.query(
    'INSERT INTO wiki_entries(title, content, category, creator_id, created_at) VALUES($1,$2,$3,$4,NOW()) RETURNING *',
    [title, content, category, creatorId]
  );
  const entry = rows[0];
  res.status(201).json({ ...entry, title: entry.title ?? 'Untitled' });
});

// PUT /api/wiki/:id and /api/wiki/entries/:id
router.put(['/entries/:id', '/:id(\\d+)'], async (req, res) => {
  const entryId = +req.params.id;
  let { title, content, category } = req.body;
  if (title !== undefined && !title.trim()) {
    title = 'Untitled';
  }
  const editorId = req.session.userId;
  const { rows } = await db!.query(
    'UPDATE wiki_entries SET title=$1, content=$2, category=$3, last_editor_id=$4, updated_at=NOW() WHERE id = $5 RETURNING *',
    [title, content, category, editorId, entryId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  const entry = rows[0];
  res.json({ ...entry, title: entry.title ?? 'Untitled' });
});

// DELETE /api/wiki/:id and /api/wiki/entries/:id
router.delete(['/entries/:id', '/:id(\\d+)'], async (req, res) => {
  const entryId = +req.params.id;
  const { rows } = await db!.query('DELETE FROM wiki_entries WHERE id = $1 RETURNING *', [entryId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  const entry = rows[0];
  res.json({ ...entry, title: entry.title ?? 'Untitled' });
});

// ----- Wiki categories -----

// GET /api/wiki/categories
router.get('/categories', async (_req, res) => {
  const { rows } = await db!.query('SELECT * FROM wiki_categories');
  const sanitized = rows.map((c) => ({ ...c, name: c.name ?? 'Untitled' }));
  res.json(sanitized);
});

// GET /api/wiki/categories/:id/entries
router.get('/categories/:id/entries', async (req, res) => {
  const categoryId = +req.params.id;
  const { rows } = await db!.query(
    'SELECT e.* FROM wiki_entries e JOIN wiki_categories c ON e.category = c.name WHERE c.id = $1',
    [categoryId]
  );
  const sanitized = rows.map((r) => ({ ...r, title: r.title ?? 'Untitled' }));
  res.json(sanitized);
});

// POST /api/wiki/categories
router.post('/categories', async (req, res) => {
  let { name, description, parentId } = req.body;
  if (!name || !name.trim()) {
    name = 'Untitled';
  }
  const { rows } = await db!.query(
    'INSERT INTO wiki_categories(name, description, parent_id, created_at, updated_at) VALUES($1,$2,$3,NOW(),NOW()) RETURNING *',
    [name, description, parentId]
  );
  const category = rows[0];
  res.status(201).json({ ...category, name: category.name ?? 'Untitled' });
});

// PUT /api/wiki/categories/:id
router.put('/categories/:id', async (req, res) => {
  const categoryId = +req.params.id;
  let { name, description, parentId } = req.body;
  if (name !== undefined && !name.trim()) {
    name = 'Untitled';
  }
  const { rows } = await db!.query(
    'UPDATE wiki_categories SET name=$1, description=$2, parent_id=$3, updated_at=NOW() WHERE id = $4 RETURNING *',
    [name, description, parentId, categoryId]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }
  const category = rows[0];
  res.json({ ...category, name: category.name ?? 'Untitled' });
});

// DELETE /api/wiki/categories/:id
router.delete('/categories/:id', async (req, res) => {
  const categoryId = +req.params.id;
  const { rows } = await db!.query('DELETE FROM wiki_categories WHERE id = $1 RETURNING *', [categoryId]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }
  const category = rows[0];
  res.json({ ...category, name: category.name ?? 'Untitled' });
});

export default router;
