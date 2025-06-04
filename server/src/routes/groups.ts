import { Router, Request, Response } from 'express';
import { db } from '../db';
import { isAuthenticated } from '../middleware/auth';
import { logger } from '../util/logger';

const router = Router();

// GET /api/groups - list all groups
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const { rows } = await db!.query(
      `SELECT g.id,
              g.name,
              g.description,
              g.creator_id    AS "creatorId",
              g.is_announcement AS "isAnnouncement",
              g.is_explanation AS "isExplanation"
         FROM groups g
         LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
        WHERE gm.user_id IS NOT NULL OR g.creator_id = $1
        ORDER BY g.name`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    logger.error('GET /groups error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/groups - create a new group
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { name, description, isAnnouncement, isExplanation } = req.body as {
      name: string;
      description?: string;
      isAnnouncement?: boolean;
      isExplanation?: boolean;
    };
    if (!name) return res.status(400).json({ error: 'Name required' });
    const creatorId = req.session.userId as number;
    const { rows } = await db!.query(
      'INSERT INTO groups (name, description, creator_id, is_announcement, is_explanation) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, creator_id AS "creatorId", is_announcement AS "isAnnouncement", is_explanation AS "isExplanation"',
      [name, description ?? null, creatorId, isAnnouncement ? 1 : 0, isExplanation ? 1 : 0]
    );
    const group = rows[0];
    await db!.query(
      'INSERT INTO group_members (group_id, user_id, is_admin) VALUES ($1, $2, 1)',
      [group.id, creatorId]
    );
    res.status(201).json(group);
  } catch (err) {
    logger.error('POST /groups error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/groups/:id - update group
router.put('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const { name, description, isAnnouncement, isExplanation } = req.body as {
      name?: string;
      description?: string;
      isAnnouncement?: boolean;
      isExplanation?: boolean;
    };
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (isAnnouncement !== undefined) {
      fields.push(`is_announcement = $${idx++}`);
      values.push(isAnnouncement ? 1 : 0);
    }
    if (isExplanation !== undefined) {
      fields.push(`is_explanation = $${idx++}`);
      values.push(isExplanation ? 1 : 0);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields' });
    values.push(id);
    const query = `UPDATE groups SET ${fields.join(', ')} WHERE id = $$${idx} RETURNING id, name, description, creator_id AS "creatorId", is_announcement AS "isAnnouncement", is_explanation AS "isExplanation"`;
    const { rows } = await db!.query(query, values);
    res.json(rows[0]);
  } catch (err) {
    logger.error('PUT /groups/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/groups/:id
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    await db!.query('DELETE FROM group_members WHERE group_id = $1', [id]);
    await db!.query('DELETE FROM groups WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /groups/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/groups/:id/users - list group members
router.get('/:id/users', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid group' });
    const { rows } = await db!.query(
      `SELECT u.id, u.username, u.email, u.first_name AS "firstName", u.last_name AS "lastName", u.avatarurl AS "avatarUrl" FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = $1`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    logger.error('GET /groups/:id/users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/groups/:id/invite - add a user to group
router.post('/:id/invite', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.id);
    const { userId } = req.body as { userId: number };
    if (!groupId || !userId) {
      return res.status(400).json({ error: 'Invalid group or user' });
    }
    const existing = await db!.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (existing.rowCount === 0) {
      await db!.query(
        'INSERT INTO group_members (group_id, user_id, is_admin) VALUES ($1, $2, 0)',
        [groupId, userId],
      );
    }
    res.json({ success: true });
  } catch (err) {
    logger.error('POST /groups/:id/invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/groups/:id/join - current user joins group
router.post('/:id/join', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.id);
    const userId = req.session.userId as number;
    if (!groupId) return res.status(400).json({ error: 'Invalid group' });
    await db!.query(
      'INSERT INTO group_members (group_id, user_id, is_admin) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING',
      [groupId, userId],
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('POST /groups/:id/join error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
