import { Router, Request, Response } from 'express';
import { login, register } from '../lib/api/auth';
import { db } from '../db';
import { broadcastStatus } from '../ws';
import { logger } from '@shared/logger';


const router: Router = Router();

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
      // Возвращаем все данные пользователя, включая флаг админа
      res.json({ ...user, isOnline: 1 });
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
     res.json({ id: newUser.id, isOnline: 1 });
  } catch (error: any) {
     logger.error('Register failed:', error);
     if (error && error.code === 'DUPLICATE') {
       return res.status(409).json({ error: 'Username or email already exists' });
     }
     res.status(500).json({ error: 'Registration error' });
   }
});

router.post('/logout', (req: Request, res: Response) => {
  const userId = (req.session as any).userId as number | undefined;
  req.session.destroy(err => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
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
  try {
    const result = await db!.query(
      `SELECT
         id,
         username,
         email,
         first_name AS "firstName",
         last_name  AS "lastName",
         job_id     AS "jobId",
         job_title  AS "jobTitle",
         avatarurl  AS "avatarUrl",
         is_admin   AS "isAdmin",
         isonline   AS "isOnline"
       FROM users
       WHERE id = $1`,
      [userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get current user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
