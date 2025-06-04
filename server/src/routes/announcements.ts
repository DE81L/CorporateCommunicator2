import { Router, Request, Response } from 'express';
import { db } from '../db';
import { isAuthenticated } from '../middleware/auth';
import { logger } from '../util/logger';

const router = Router();

// GET /api/announcements - list all announcement groups with creator department
router.get('/', isAuthenticated, async (_req: Request, res: Response) => {
  try {
    const { rows } = await db!.query(
      `SELECT g.id,
              g.name,
              g.description,
              g.creator_id AS "creatorId",
              d.name        AS "departmentName"
         FROM groups g
         JOIN users u ON u.id = g.creator_id
         LEFT JOIN departments d ON u.department_id = d.id
        WHERE g.is_announcement = 1
        ORDER BY g.id DESC`
    );
    res.json(rows);
  } catch (err) {
    logger.error('GET /announcements error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
