import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/tasks - list all tasks
router.get('/', async (_req, res) => {
  const { rows } = await db!.query('SELECT id, name, category FROM tasks_catalog ORDER BY id');
  res.json(rows);
});

export default router;
