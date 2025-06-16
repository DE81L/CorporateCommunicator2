import { Router } from 'express';
import { db } from '../db';

const router: Router = Router();

// GET /api/departments - list all subdivisions
router.get('/', async (_req, res) => {
  const { rows } = await db!.query('SELECT id, name FROM subdivisions ORDER BY name');
  res.json(rows);
});

export default router;
