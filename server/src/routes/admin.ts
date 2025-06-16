import { Router, Request, Response } from 'express';
import { db } from '../db';
import { logger } from '../util/logger';
import { isAuthenticated } from '../middleware/auth';
import { register } from '../lib/api/auth';

const router: Router = Router();

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

// POST /api/admin/table/:name/insert - insert a new row
router.post('/table/:name/insert', isAuthenticated, async (req: Request, res: Response) => {
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
    if (!row) {
      return res.status(400).json({ error: 'Row data required' });
    }

    const keys = Object.keys(row);
    const values = keys.map(k => row[k]);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, idx) => `$${idx + 1}`).join(', ');
    const query = `INSERT INTO ${table} (${cols}) VALUES (${params}) RETURNING *`;
    const result = await db!.query(query, values);
    res.status(201).json({ row: result.rows[0] });
  } catch (err) {
    logger.error('Admin table insert error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// DELETE /api/admin/table/:name/:id - delete row by id
router.delete('/table/:name/:id', isAuthenticated, async (req: Request, res: Response) => {
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

    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    await db!.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Admin table delete error:', err);
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
      `SELECT
         u.id,
         u.username,
         u.email,
         u.first_name AS "firstName",
         u.last_name  AS "lastName",
         u.department_id AS "departmentId",
         d.name        AS "departmentName",
         u.job_id      AS "jobId",
         u.job_title   AS "jobTitle",
         u.is_admin    AS "isAdmin",
         u.isonline    AS "isOnline"
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.id`,
    );
    res.json({ users: result.rows });
  } catch (err) {
    logger.error('Admin users list error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /api/admin/users - create a new user without logging in
router.post('/users', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const adminId = req.session.userId as number;
    const { rows } = await db!.query<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [adminId],
    );
    if (!rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const newUser = await register(req.body);
    res.status(201).json({ user: newUser });
  } catch (err) {
    logger.error('Admin user create error:', err);
    if ((err as any).code === 'DUPLICATE') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(400).json({ error: (err as Error).message });
  }
});

// PATCH /api/admin/users/:id - update user fields (isAdmin, department, job)
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
    const { isAdmin, departmentId, jobId } = req.body as {
      isAdmin?: boolean;
      departmentId?: number | null;
      jobId?: number | null;
    };
    if (!id) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (typeof isAdmin === 'boolean') {
      if (adminId === id && isAdmin === false) {
        return res
          .status(400)
          .json({ error: "Can't remove your own admin rights" });
      }
      updates.push(`is_admin = $${params.length + 1}`);
      params.push(isAdmin ? 1 : 0);
    }

    if (departmentId !== undefined) {
      updates.push(`department_id = $${params.length + 1}`);
      params.push(departmentId);
    }

    if (jobId !== undefined) {
      let title: string | null = null;
      if (jobId) {
        const { rows } = await db!.query<{ name: string }>(
          'SELECT name FROM jobs WHERE id = $1',
          [jobId]
        );
        title = rows[0]?.name ?? null;
      }
      updates.push(`job_id = $${params.length + 1}`);
      params.push(jobId);
      updates.push(`job_title = $${params.length + 1}`);
      params.push(title);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    await db!.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    res.json({ success: true });
  } catch (err) {
    logger.error('Admin user update error:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
