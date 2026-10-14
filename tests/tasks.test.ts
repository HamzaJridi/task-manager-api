import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { bearer, createTask, registerAndLogin } from './helpers.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const validTask = { name: 'Write report', description: 'Quarterly numbers', status: 'TODO' };

describe('POST /api/tasks', () => {
  it('creates a task owned by the authenticated user and stores it', async () => {
    const me = await registerAndLogin();
    const res = await request(app).post('/api/tasks').set('Authorization', bearer(me.token)).send(validTask);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ ...validTask, userId: me.user.id });
    expect(res.body.id).toMatch(UUID);
    expect(Number.isNaN(Date.parse(res.body.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(res.body.updatedAt))).toBe(false);

    const row = await prisma.task.findUnique({ where: { id: res.body.id } });
    expect(row).toMatchObject({ ...validTask, userId: me.user.id });
  });

  it('ignores a userId sent in the body: the owner comes from the token', async () => {
    const me = await registerAndLogin();
    const other = await registerAndLogin();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', bearer(me.token))
      .send({ ...validTask, userId: other.user.id });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(me.user.id);
  });

  it.each([
    ['a missing name', { description: 'x', status: 'TODO' }],
    ['an empty description', { name: 'x', description: '', status: 'TODO' }],
    ['an unknown status', { name: 'x', description: 'x', status: 'NOPE' }],
  ])('rejects %s (422) and stores nothing', async (_label, body) => {
    const me = await registerAndLogin();
    const res = await request(app).post('/api/tasks').set('Authorization', bearer(me.token)).send(body);

    expect(res.status).toBe(422);
    expect(await prisma.task.count()).toBe(0);
  });
});

describe('reading a task back', () => {
  it('returns it by id and in the list', async () => {
    const me = await registerAndLogin();
    const task = await createTask(me.token, { name: 'Read me' });

    const byId = await request(app).get(`/api/tasks/${task.id}`).set('Authorization', bearer(me.token));
    const list = await request(app).get('/api/tasks').set('Authorization', bearer(me.token));

    expect(byId.status).toBe(200);
    expect(byId.body).toEqual(task);
    expect(list.status).toBe(200);
    expect(list.body).toEqual([task]);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates the task for its owner', async () => {
    const me = await registerAndLogin();
    const task = await createTask(me.token);
    const changes = { name: 'Renamed', description: 'New description', status: 'DONE' };

    const res = await request(app).put(`/api/tasks/${task.id}`).set('Authorization', bearer(me.token)).send(changes);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...changes, id: task.id, userId: me.user.id });
    const row = await prisma.task.findUnique({ where: { id: task.id } });
    expect(row).toMatchObject(changes);
  });

  it('cannot change the owner through the body', async () => {
    const me = await registerAndLogin();
    const other = await registerAndLogin();
    const task = await createTask(me.token);

    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Authorization', bearer(me.token))
      .send({ name: 'Renamed', description: 'x', status: 'DONE', userId: other.user.id });

    expect(res.status).toBe(200);
    const row = await prisma.task.findUnique({ where: { id: task.id } });
    expect(row?.userId).toBe(me.user.id);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes the task for its owner (204) and it is gone', async () => {
    const me = await registerAndLogin();
    const task = await createTask(me.token);

    const del = await request(app).delete(`/api/tasks/${task.id}`).set('Authorization', bearer(me.token));
    const after = await request(app).get(`/api/tasks/${task.id}`).set('Authorization', bearer(me.token));

    expect(del.status).toBe(204);
    expect(del.text).toBe('');
    expect(after.status).toBe(404);
    expect(await prisma.task.count()).toBe(0);
  });
});

describe('GET /api/tasks: pagination and filters', () => {
  it('returns the requested page and limit, and an empty page beyond the end', async () => {
    const me = await registerAndLogin();
    for (let i = 1; i <= 5; i++) await createTask(me.token, { name: `Task ${i}` });
    const get = (query: string) => request(app).get(`/api/tasks?${query}`).set('Authorization', bearer(me.token));

    const page1 = await get('page=1&limit=2');
    const page3 = await get('page=3&limit=2');
    const page4 = await get('page=4&limit=2');

    expect([page1.status, page3.status, page4.status]).toEqual([200, 200, 200]);
    expect([page1.body.length, page3.body.length, page4.body.length]).toEqual([2, 1, 0]);
  });

  it('pages do not overlap and together cover every task', async () => {
    const me = await registerAndLogin();
    for (let i = 1; i <= 5; i++) await createTask(me.token, { name: `Task ${i}` });
    const get = (query: string) => request(app).get(`/api/tasks?${query}`).set('Authorization', bearer(me.token));

    const pages = [await get('page=1&limit=2'), await get('page=2&limit=2'), await get('page=3&limit=2')];
    const ids = pages.flatMap((page) => page.body.map((task: { id: string }) => task.id));

    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  it.each([
    ['a negative limit', 'limit=-1'],
    ['a zero limit', 'limit=0'],
    ['a limit above the maximum', 'limit=101'],
    ['a non-numeric limit', 'limit=abc'],
    ['page zero', 'page=0'],
    ['a negative page', 'page=-1'],
  ])('rejects %s (422)', async (_label, query) => {
    const me = await registerAndLogin();
    const res = await request(app).get(`/api/tasks?${query}`).set('Authorization', bearer(me.token));
    expect(res.status).toBe(422);
  });

  it('filters by status, and rejects an unknown status (422)', async () => {
    const me = await registerAndLogin();
    await createTask(me.token, { status: 'TODO' });
    await createTask(me.token, { status: 'DONE' });
    await createTask(me.token, { status: 'DONE' });

    const done = await request(app).get('/api/tasks?status=DONE').set('Authorization', bearer(me.token));
    const unknown = await request(app).get('/api/tasks?status=NOPE').set('Authorization', bearer(me.token));

    expect(done.body).toHaveLength(2);
    expect(done.body.every((task: { status: string }) => task.status === 'DONE')).toBe(true);
    expect(unknown.status).toBe(422);
  });
});
