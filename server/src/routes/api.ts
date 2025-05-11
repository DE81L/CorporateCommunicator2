import { Router } from 'express';
import { log } from '../util/logger';

const router = Router();

router.get('/health', (_req, res) => {
  log('GET /api/health');
  res.json({ status: 'ok' });
});

export default router;
