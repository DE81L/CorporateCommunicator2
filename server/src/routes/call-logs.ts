import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { db } from '../db';
import { logger } from '../util/logger';

const router = Router();

router.use(isAuthenticated);

router.post('/', async (req, res) => {
  try {
    const callerId = req.session.userId as number;
    const { calleeId, callType } = req.body as {
      calleeId: number;
      callType: 'video' | 'audio';
    };
    if (!calleeId || !callType) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const result = await db!.query<{ id: number }>(
      'INSERT INTO call_logs (caller_id, callee_id, call_type) VALUES ($1,$2,$3) RETURNING id',
      [callerId, calleeId, callType],
    );
    const id = result.rows[0].id;
    logger.info(`Call started ${id}: ${callerId} -> ${calleeId} (${callType})`);
    res.status(201).json({ id });
  } catch (err) {
    logger.error('Create call log failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/end', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    await db!.query('UPDATE call_logs SET ended_at = NOW() WHERE id = $1', [id]);
    logger.info(`Call ended ${id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('End call log failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
