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

// GET /api/admin/tables - list database tables
router.get('/tables', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const { rows } = await db!.query<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );
    if (!rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await db!.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    res.json({ tables: result.rows.map(r => r.table_name) });
  } catch (err) {
    logger.error('Admin tables error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/admin/table/:name - fetch rows from table
router.get('/table/:name', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const { rows } = await db!.query<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );
    if (!rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const table = req.params.name;
    // basic validation to avoid SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const result = await db!.query(`SELECT * FROM ${table} LIMIT 100`);
    res.json({ rows: result.rows });
  } catch (err) {
    logger.error('Admin table fetch error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /api/admin/table/:name - update a row by id
router.post('/table/:name', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const { rows } = await db!.query<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );
    if (!rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const table = req.params.name;
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const { row } = req.body as { row?: Record<string, any> };
    if (!row || typeof row.id === 'undefined') {
      return res.status(400).json({ error: 'Row with id required' });
    }

    const keys = Object.keys(row).filter(k => k !== 'id');
    const values = keys.map(k => row[k]);
    const set = keys.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
    const query = `UPDATE ${table} SET ${set} WHERE id = $${keys.length + 1}`;
    await db!.query(query, [...values, row.id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Admin table update error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/admin/users - list all users
router.get('/users', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as number;
    const { rows } = await db!.query<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId],
    );
    if (!rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await db!.query(
      `SELECT id, username, email, first_name AS "firstName", last_name AS "lastName", job_title AS "jobTitle", is_admin AS "isAdmin", isonline AS "isOnline" FROM users ORDER BY id`,
    );
    res.json({ users: result.rows });
  } catch (err) {
    logger.error('Admin users list error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// PATCH /api/admin/users/:id - update user fields (currently only isAdmin)
router.patch('/users/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const adminId = req.session.userId as number;
    const { rows } = await db!.query<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [adminId],
    );
    if (!rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const id = Number(req.params.id);
    const { isAdmin } = req.body as { isAdmin?: boolean };
    if (!id || typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request' });
    }

    await db!.query('UPDATE users SET is_admin = $1 WHERE id = $2', [isAdmin ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Admin user update error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
