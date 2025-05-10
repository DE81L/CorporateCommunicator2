import request from 'supertest';
import type { Express } from 'express';
import { app } from '../server/app.ts';

describe('API Health Check', () => {
  let server: Express;

  beforeEach(() => {
    server = app;
  });

  it('should return 200 and ok status for health check', async () => {
    const response = await request(server)
      .get('/health')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(server)
      .get('/unknown-route')
      .expect('Content-Type', /json/);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});