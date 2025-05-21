import { Router, Request, Response } from 'express';
import { db } from '../db';
import { logger } from '../util/logger';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// POST /api/admin/sql - execute arbitrary SQL query (admin only)
router.post('/sql', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const { rows } = await db!.query<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );
    if (!rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { query } = req.body as { query?: string };
    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    const result = await db!.query(query);
    res.json({ rows: result.rows });
  } catch (err) {
    logger.error('Admin SQL error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
