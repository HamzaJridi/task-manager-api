import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { env } from '../src/schemas/env.schema.js';
import { bearer, createAdminAndLogin, createTask, registerAndLogin } from './helpers.js';

describe('authentication on the task routes', () => {
  const someId = randomUUID();

  it.each([
    ['get', '/api/tasks'],
    ['post', '/api/tasks'],
    ['get', `/api/tasks/${someId}`],
    ['put', `/api/tasks/${someId}`],
    ['delete', `/api/tasks/${someId}`],
  ] as const)('%s %s without a token is rejected (401)', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });

  it('rejects an Authorization header with no token (401)', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer');
    expect(res.status).toBe(401);
  });

  it('rejects a token that is not a JWT (401)', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', bearer('not-a-jwt'));
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with another secret (401)', async () => {
    const me = await registerAndLogin();
    const forged = jwt.sign({ userId: me.user.id, role: 'ADMIN' }, 'some-other-secret');

    const res = await request(app).get('/api/tasks').set('Authorization', bearer(forged));
    expect(res.status).toBe(401);
  });

  it('rejects an expired token (401) with its own message', async () => {
    const me = await registerAndLogin();
    const expired = jwt.sign(
      { userId: me.user.id, role: 'MEMBER', exp: Math.floor(Date.now() / 1000) - 60 },
      env.JWT_SECRET,
    );

    const res = await request(app).get('/api/tasks').set('Authorization', bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token has expired');
  });
});

describe('ownership: user A cannot touch user B tasks', () => {
  it('forbids reading, updating and deleting (403), leaks nothing, and leaves the task untouched', async () => {
    const a = await registerAndLogin();
    const b = await registerAndLogin();
    const task = await createTask(b.token, { name: 'Private task' });

    const read = await request(app).get(`/api/tasks/${task.id}`).set('Authorization', bearer(a.token));
    const update = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', bearer(a.token))
      .send({ name: 'Hacked', description: 'Hacked', status: 'DONE' });
    const remove = await request(app).delete(`/api/tasks/${task.id}`).set('Authorization', bearer(a.token));

    expect([read.status, update.status, remove.status]).toEqual([403, 403, 403]);
    expect(JSON.stringify(read.body)).not.toContain('Private task');

    const row = await prisma.task.findUnique({ where: { id: task.id } });
    expect(row).toMatchObject({ name: 'Private task', userId: b.user.id });
  });

  it('answers 404 for a task that does not exist', async () => {
    const me = await registerAndLogin();
    const res = await request(app).get(`/api/tasks/${randomUUID()}`).set('Authorization', bearer(me.token));
    expect(res.status).toBe(404);
  });

  it('answers 422 for an id that is not a UUID', async () => {
    const me = await registerAndLogin();
    const res = await request(app).get('/api/tasks/123').set('Authorization', bearer(me.token));
    expect(res.status).toBe(422);
  });

  it('lists only the caller own tasks', async () => {
    const a = await registerAndLogin();
    const b = await registerAndLogin();
    await createTask(a.token, { name: 'A1' });
    await createTask(a.token, { name: 'A2' });
    await createTask(b.token, { name: 'B1' });

    const res = await request(app).get('/api/tasks').set('Authorization', bearer(a.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((task: { userId: string }) => task.userId === a.user.id)).toBe(true);
  });

  it('lets an ADMIN read another user task and list everyone tasks', async () => {
    const member = await registerAndLogin();
    const admin = await createAdminAndLogin();
    const task = await createTask(member.token, { name: 'Member task' });

    const read = await request(app).get(`/api/tasks/${task.id}`).set('Authorization', bearer(admin.token));
    const list = await request(app).get('/api/tasks').set('Authorization', bearer(admin.token));

    expect(read.status).toBe(200);
    expect(read.body.id).toBe(task.id);
    expect(list.body).toHaveLength(1);
  });
});

// Not covered yet: an unknown route returns Express's HTML 404, not a JSON error (no catch-all).
it.todo('answers unknown routes with a JSON 404');
