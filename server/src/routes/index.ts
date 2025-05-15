import { Router } from 'express';
import departmentsRouter from './departments';

const router = Router();

router.use('/departments', departmentsRouter);

export default router;
