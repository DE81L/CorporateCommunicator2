/// <reference path="../types/express-session.d.ts" />
import 'express-session';

import { Router, Request, Response } from 'express';
import { login, register } from '../lib/api/auth';
import { logger } from '../util/logger';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const user = await login(usernameOrEmail, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.userId   = user.id;
    req.session.username = user.username;
    await new Promise<void>((resolve, reject) =>
      req.session.save(err => err ? reject(err) : resolve())
    );
    res.json({ id: user.id });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({ message: (error as Error).message });
  }
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

router.get('/user', isAuthenticated, (req: Request, res: Response) => {
  res.json({ id: req.session.userId, username: req.session.username });
});

export default router;
