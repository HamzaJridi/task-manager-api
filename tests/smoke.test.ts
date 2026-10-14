// Proves the setup works: app imported without listen(), real test database reachable.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('test setup', () => {
  it('GET /health reaches the app and the test database', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.db).toBe('ok');
  });
});
