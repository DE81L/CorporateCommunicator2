import { Router, Request, Response } from 'express';
import { db } from '../db';
import { isAuthenticated } from '../middleware/auth';
import { logger } from '../util/logger';
import { getFile, clearFile, findStoredFilePath } from '../store/messageStore';

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

// GET /api/announcements/:id/messages - list messages for an announcement
router.get('/:id/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const { rows: g } = await db!.query<{ is_announcement: number }>(
      'SELECT is_announcement FROM groups WHERE id = $1',
      [id],
    );
    if (!g[0]?.is_announcement) {
      return res.status(404).json({ error: 'Not found' });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before ? new Date(req.query.before as string) : new Date();

    const history = await db!.query(
      `SELECT m.id,
              m.sender_id   AS "senderId",
              m.group_id    AS "groupId",
              m.content,
              m.timestamp,
              m.status,
              u.first_name  AS "firstName",
              u.last_name   AS "lastName",
              u.avatarurl  AS "avatarUrl"
         FROM messages m
         JOIN users u ON u.id = m.sender_id
        WHERE m.group_id = $1 AND m.timestamp < $2
        ORDER BY m.timestamp ASC
        LIMIT $3`,
      [id, before, limit]
    );

    const withFiles = history.rows.map((m) => {
      let f = getFile(m.id);
      if (!f) {
        f = findStoredFilePath(m.id);
      } else {
        clearFile(m.id);
      }
      return { ...m, file: f ?? null };
    });
    res.json(withFiles);
  } catch (err) {
    logger.error('GET /announcements/:id/messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
