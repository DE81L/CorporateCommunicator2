import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/departments - list all departments
router.get('/', async (_req, res) => {
  const { rows } = await db!.query('SELECT id, name FROM departments ORDER BY name');
  res.json(rows);
});

export default router;
