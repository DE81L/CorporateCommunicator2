/// <reference path="../types/express-session.d.ts" />
import 'express-session';

import { Router, Request, Response } from 'express';
import { login, register } from '../lib/api/auth';
import { client } from '../db';
import { logger } from '../util/logger';
import { isAuthenticated } from '../middleware/auth';


const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    // клиент может прислать username | email | usernameOrEmail
    const {
      username,
      email,
      usernameOrEmail,
      password,
    }: {
      username?: string;
      email?: string;
      usernameOrEmail?: string;
      password: string;
    } = req.body;

    const loginId = usernameOrEmail || username || email;
    if (!loginId || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await login(loginId, password);
    req.session.userId = user.id;
    req.session.username = user.username;
    await new Promise<void>((r, e) => req.session.save(err => (err ? e(err) : r())));
    res.json(user);
  } catch (err) {
    logger.error("Login error:", err);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Обновление онлайн-статуса текущего пользователя
router.patch(
  '/users/status',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { isonline } = req.body as { isonline: 0 | 1 };
      const userId = (req.session as any).userId as number;
      if (isonline !== 0 && isonline !== 1) {
        return res.status(400).json({ error: 'Invalid isonline value' });
      }
      await client!.query(
        `UPDATE users SET isonline = $1 WHERE id = $2`,
        [isonline, userId]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Status update error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/user', isAuthenticated, (req: Request, res: Response) => {
  res.json({ id: req.session.userId, username: req.session.username });
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const newUser = await register(req.body);
    req.session.userId   = newUser.id;
    req.session.username = newUser.username;
    await new Promise<void>((resolve, reject) =>
      req.session.save(err => err ? reject(err) : resolve())
    );
    res.json({ id: newUser.id });
  } catch (error) {
    logger.error('Register failed:', error);
    res.status(500).json({ error: 'Registration error' });
  }
});

// Список контактов (все пользователи, кроме себя)
router.get(
  '/contacts',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId as number;
      const result = await client!.query(
        `SELECT id,
                username,
                email,
                first_name  AS "firstName",
                last_name   AS "lastName",
                isonline
           FROM users
          WHERE id <> $1`,
        [userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Get contacts error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get("/health", (_req, res) => res.json({ status: "ok" }));
router.get("/hello", (_req, res) => res.json({ message: "👋" }));

export default router;
