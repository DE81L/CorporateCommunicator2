import { Router, Request, Response } from 'express';
import { login, register } from '../lib/api/auth';
import { db } from '../db';
import { broadcastStatus } from '../ws';
import { logger } from '@shared/logger';


const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
      const user = await login(usernameOrEmail, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // сохраняем в сессии
      req.session.userId = user.id;
      req.session.username = user.username;
      // ждем, пока сессия сохранится в хранилище
      await new Promise<void>((resolve, reject) =>
        req.session.save(err => err ? reject(err) : resolve())
      );
      await db!.query('UPDATE users SET isonline = 1 WHERE id = $1', [user.id]);
      broadcastStatus(user.id, 1);
      res.json({ id: user.id });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({ message: (error as Error).message });
    }
});

router.post('/register', async (req: Request, res: Response) => {
   try {
     const userData = req.body;
     const newUser = await register(userData);
     // сразу логиним после регистрации
     req.session.userId = newUser.id;
     req.session.username = newUser.username;
     await new Promise<void>((resolve, reject) =>
       req.session.save(err => err ? reject(err) : resolve())
     );
     await db!.query('UPDATE users SET isonline = 1 WHERE id = $1', [newUser.id]);
     broadcastStatus(newUser.id, 1);
     res.json({ id: newUser.id });
   } catch (error) {
     logger.error('Register failed:', error);
     res.status(500).json({ error: 'Registration error' });
   }
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    const userId = (req.session as any).userId as number | undefined;
    if (userId) {
      db!.query('UPDATE users SET isonline = 0 WHERE id = $1', [userId])
        .then(() => broadcastStatus(userId, 0))
        .catch((e) => logger.error('Set offline failed:', e));
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.get('/user', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // ... get user data
  res.json({ id: userId });
});

export default router;
