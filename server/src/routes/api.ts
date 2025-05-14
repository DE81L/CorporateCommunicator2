import { Router, Request, Response } from 'express';
import { logger } from '../util/logger';
import { client } from '../db';

// Поверх всех API-эндпоинтов проверяем сессию
// (если вы вынесли isAuthenticated в middleware, можно заменить на router.use(isAuthenticated))

const router: Router = Router();
// общая проверка
router.use((req: Request, res: Response, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
});

router.get('/health', (_req, res) => {
  logger.debug('GET /health');
  res.json({ status: 'ok' });
});

router.get('/hello', (_req, res) => {
  res.json({ message: 'Hello from API' });
});


router.get('/user', async (req: Request, res: Response) => {
  try {
    const result = await client!.query(
      `SELECT id, username, email FROM users WHERE id = $1`,
      [req.session.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('GET /user failed:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

 export default router;