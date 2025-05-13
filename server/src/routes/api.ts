import { Router } from 'express';
import { logger } from '../util/logger';

const router: Router = Router();

router.get('/health', (_req, res) => {
  logger.debug('GET /health');
  res.json({ status: 'ok' });
});

router.get('/hello', (_req, res) => {
  res.json({ message: 'Hello from API' });
});

router.get('/user', (_req, res) => {
  // Replace later with real auth check
  res.json(null); // Returns null as 'not logged in'
});

export default router;
