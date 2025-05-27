import { Router, Request, Response } from 'express';
import { db } from '../db';
import { isAuthenticated } from '../middleware/auth';
import { logger } from '../util/logger';

const router = Router();

// GET /api/groups - list all groups
router.get('/', isAuthenticated, async (_req: Request, res: Response) => {
  try {
    const { rows } = await db!.query(
      'SELECT id, name, description, creator_id AS "creatorId", is_announcement AS "isAnnouncement" FROM groups ORDER BY name'
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
    const { name, description, isAnnouncement } = req.body as {
      name: string;
      description?: string;
      isAnnouncement?: boolean;
    };
    if (!name) return res.status(400).json({ error: 'Name required' });
    const creatorId = req.session.userId as number;
    const { rows } = await db!.query(
      'INSERT INTO groups (name, description, creator_id, is_announcement) VALUES ($1, $2, $3, $4) RETURNING id, name, description, creator_id AS "creatorId", is_announcement AS "isAnnouncement"',
      [name, description ?? null, creatorId, isAnnouncement ? 1 : 0]
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
    const { name, description, isAnnouncement } = req.body as {
      name?: string;
      description?: string;
      isAnnouncement?: boolean;
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
    if (!fields.length) return res.status(400).json({ error: 'No fields' });
    values.push(id);
    const query = `UPDATE groups SET ${fields.join(', ')} WHERE id = $$${idx} RETURNING id, name, description, creator_id AS "creatorId", is_announcement AS "isAnnouncement"`;
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

export default router;
