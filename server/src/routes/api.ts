/// <reference path="../types/express-session.d.ts" />
import 'express-session';
import { Router, Request, Response } from 'express';
import { login, register } from '../lib/api/auth'; // Уже есть
import { db } from '../db'; // Уже есть
import { logger } from '../util/logger'; // Уже есть
import { isAuthenticated } from '../middleware/auth'; // Уже есть
import { broadcastStatus, sendChatMessage } from '../ws'; // Уже есть
import departmentsRouter from './departments';
import wikiRouter from './wiki';

const router = Router();
router.use('/departments', isAuthenticated, departmentsRouter);
router.use('/wiki', isAuthenticated, wikiRouter); // <--- И ЭТО
/**
 * POST /api/login
 * Логин пользователя.
 * Тело: { usernameOrEmail: string, password: string }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password }: { usernameOrEmail: string; password: string } = req.body;
    const user = await login(usernameOrEmail, password);
    // сохраняем в сессии
    req.session.userId = user.id;
    req.session.username = user.username;
    await new Promise<void>((resolve, reject) =>
      req.session.save(err => (err ? reject(err) : resolve()))
    );
    res.json(user);
  } catch (err) {
    logger.error('Login error:', err);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

/**
 * POST /api/register
 * Регистрация нового пользователя.
 * Тело: { username, email, password, firstName, lastName }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const newUser = await register(req.body);
    // логин в сессии сразу после регистрации
    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    await new Promise<void>((resolve, reject) =>
      req.session.save(err => (err ? reject(err) : resolve()))
    );
    res.status(201).json(newUser);
  } catch (err) {
    logger.error('Register error:', err);
    res.status(400).json({ error: 'Invalid request' });
  }
});

/**
 * GET /api/user
 * Информация о текущем пользователе.
 */
router.get('/user', isAuthenticated, (req: Request, res: Response) => {
  res.json({ id: req.session.userId, username: req.session.username });
});

/**
 * PATCH /api/users/status
 * Обновление online/offline статуса пользователя.
 * Тело: { isonline: 0|1 }
 */
router.patch(
  '/users/status',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { isonline } = req.body as { isonline: 0 | 1 };
      const userId = req.session.userId as number;
      if (isonline !== 0 && isonline !== 1) {
        return res.status(400).json({ error: 'Invalid isonline value' });
      }
      await db!.query(
        `UPDATE users SET isonline = $1 WHERE id = $2`,
        [isonline, userId]
      );
      broadcastStatus(userId, isonline);
      res.json({ success: true });
    } catch (err) {
      logger.error('Status update error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * GET /api/contacts
 * Список всех пользователей (кроме себя) с полем isonline.
 */
router.get(
  '/contacts',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const result = await db!.query(
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
      logger.error('Get contacts error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * POST /api/messages
 * Отправка сообщения: сохраняет в БД, и если оба пользователя онлайн —
 * сразу шлёт по WS и помечает как доставленное.
 * Тело: { receiverId: number; content: string }
 */
router.post(
  '/messages',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const senderId = req.session.userId as number;
      const { receiverId, content } = req.body as {
        receiverId: number;
        content: string;
      };
      if (!receiverId || !content?.trim()) {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      const insert = await db!.query(
        `INSERT INTO messages
           (sender_id, receiver_id, content, timestamp, status)
         VALUES
           ($1, $2, $3, NOW(), 'pending')
         RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content, timestamp`,
        [senderId, receiverId, content.trim()]
      );
      const message = insert.rows[0];
      // проверяем, онлайн ли оба
      const statusCheck = await db!.query(
        `SELECT isonline FROM users WHERE id = ANY($1::int[])`,
        [[senderId, receiverId]]
      );
      const bothOnline = statusCheck.rows.every((u) => u.isonline === 1);
      if (bothOnline) {
        sendChatMessage(receiverId, {
          ...message,
          timestamp: message.timestamp.toISOString(),
        });
        await db!.query(
          `UPDATE messages SET status = 'delivered' WHERE id = $1`,
          [message.id]
        );
      }
      res.status(201).json(message);
    } catch (err) {
      logger.error('POST /messages error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.use('/departments', isAuthenticated, departmentsRouter); // Добавляем роутер для департаментов
/**
 * GET /api/messages?chatWith={id}
 * Возвращает всю историю между текущим пользователем и chatWith,
 * а также помечает входящие pending-сообщения как delivered.
 */
router.get(
  '/messages',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const chatWith = Number(req.query.chatWith);
      if (!chatWith) {
        return res.status(400).json({ error: 'chatWith is required' });
      }
      const history = await db!.query(
        `SELECT
           id,
           sender_id   AS "senderId",
           receiver_id AS "receiverId",
           content,
           timestamp,
           status
         FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY timestamp ASC`,
        [userId, chatWith]
      );
      await db!.query(
        `UPDATE messages
            SET status = 'delivered'
          WHERE sender_id = $2
            AND receiver_id = $1
            AND status = 'pending'`,
        [userId, chatWith]
      );
      res.json(history.rows);
    } catch (err) {
      logger.error('GET /messages error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
