import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/jobs - list all job positions
router.get('/', async (_req, res) => {
  const { rows } = await db!.query('SELECT id, name FROM jobs ORDER BY name');
  res.json(rows);
});

export default router;
