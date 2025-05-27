/*
 * Эндпоинты для логирования звонков временно отключены.
 */

// import { Router } from 'express';
// import { isAuthenticated } from '../middleware/auth';
// import { logger } from '../util/logger';

// const router = Router();
//
// router.use(isAuthenticated);
//
// router.post('/', async (req, res) => {
//   try {
//     const callerId = req.session.userId as number;
//     const { calleeId, callType } = req.body as {
//       calleeId: number;
//       callType: 'video' | 'audio';
//     };
//     if (!calleeId || !callType) {
//       return res.status(400).json({ error: 'Missing fields' });
//     }
//     const id = Date.now();
//     logger.info(`Call started ${id}: ${callerId} -> ${calleeId} (${callType})`);
//     res.status(201).json({ id });
//   } catch (err) {
//     logger.error('Create call log failed:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
//
// router.post('/:id/end', async (req, res) => {
//   try {
//     const id = Number(req.params.id);
//     if (!id) return res.status(400).json({ error: 'Invalid id' });
//     logger.info(`Call ended ${id}`);
//     res.json({ success: true });
//   } catch (err) {
//     logger.error('End call log failed:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
//
// export default router;
