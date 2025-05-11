import express, { Request, Response, NextFunction } from 'express';
import { logger } from '../util/logger';
import apiRouter from './routes/api';

const app = express();

app.use('/api', apiRouter);

// catch all unmatched routes
app.all('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;