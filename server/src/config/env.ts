import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: resolve(__dirname, '../../../.env') });

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL,
  apiPrefix: '/api',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || 'no-reply@example.com'
};
