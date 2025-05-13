import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { log } from './util/logger.js'; 

const API_TARGET = 'http://localhost:3000';
const PORT = 4000;

const app = express();

app.use((req, res, next) => {
  log(`[PROXY] ${req.method} ${req.url}`);
  next();
});

app.use(
  '/api',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    onProxyReq(proxyReq, req, res) {
      log(`[PROXY → BACKEND] ${req.method} ${req.originalUrl}`);
    },
    onProxyRes(proxyRes, req, res) {
      log(`[BACKEND → PROXY] ${req.method} ${req.originalUrl} → ${proxyRes.statusCode}`);
    },
    onError(err, req, res) {
      console.error('[PROXY ERROR]', err);
      res.status(500).send('Proxy error');
    },
  })
);

app.listen(PORT, () => {
  console.log(`➡️  Proxy listening: http://localhost:${PORT}/api → ${API_TARGET}`);
});
