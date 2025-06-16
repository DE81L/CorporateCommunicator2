import { Router, Request, Response } from 'express';
import { db } from '../db';
import { isAuthenticated } from '../middleware/auth';

const router: Router = Router();

router.post('/register', isAuthenticated, async (req: Request, res: Response) => {
  const token = req.body?.token as string | undefined;
  const userId = req.session.userId as number;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    await db!.query(
      'INSERT INTO push_tokens (user_id, token) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, token]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to store token' });
  }
});

router.post('/unregister', isAuthenticated, async (req: Request, res: Response) => {
  const token = req.body?.token as string | undefined;
  const userId = req.session.userId as number;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    await db!.query('DELETE FROM push_tokens WHERE user_id = $1 AND token = $2', [userId, token]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove token' });
  }
});

export default router;
