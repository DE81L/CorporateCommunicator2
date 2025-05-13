import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const API_TARGET = 'http://localhost:3000';  // ваш бэкенд
const PORT = 4000;                          // порт для теста прокси

const app = express();

// Логируем каждый входящий запрос
app.use((req, res, next) => {
  console.log(`[PROXY] ${req.method} ${req.url}`);
  next();
});

// Настраиваем прокси для /api
app.use(
  '/api',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    logLevel: 'debug',      // подробный лог работы прокси
    onError(err, req, res) {
      console.error('[PROXY ERROR]', err);
      res.status(500).send('Proxy error');
    },
  })
);

app.listen(PORT, () => {
  console.log(`➡️  Proxy listening: http://localhost:${PORT}/api → ${API_TARGET}`);
});
