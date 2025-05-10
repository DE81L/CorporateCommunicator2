import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { connectDb } from './db';
import router from './routes';
import { log } from '../util/logger';
import { logger } from './config/logging';

export const app = express();

export async function createApp() {
  // Request logging
  app.use(morgan('dev'));

  // Debug logging middleware
  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.url}`);
    next();
  });

  // Basic middleware
  app.use
}