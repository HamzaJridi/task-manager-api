import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { verifyToken } from '../src/lib/jwt.js';

const valid = { name: 'Test User', email: 'auth@test.example.com', password: 'Password123!' };
const BCRYPT_HASH = /\$2[aby]\$/;

describe('POST /api/auth/register', () => {
  it('stores the password hashed, never in clear text', async () => {
    await request(app).post('/api/auth/register').send(valid).expect(201);

    const row = await prisma.user.findUnique({ where: { email: valid.email } });
    expect(row).not.toBeNull();
    expect(row?.password).not.toBe(valid.password);
    expect(row?.password).toMatch(BCRYPT_HASH);
  });

  it('rejects a duplicate email with 409 and keeps a single account', async () => {
    await request(app).post('/api/auth/register').send(valid).expect(201);
    const second = await request(app).post('/api/auth/register').send(valid);

    expect(second.status).toBe(409);
    expect(await prisma.user.count({ where: { email: valid.email } })).toBe(1);
  });

  it.each([
    ['too short', 'Aa1!'],
    ['no uppercase letter', 'password123!'],
    ['no lowercase letter', 'PASSWORD123!'],
    ['no number', 'Password!!!'],
    ['no symbol', 'Password123'],
  ])('rejects a password with %s (422) and creates no user', async (_label, password) => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, password });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((issue: { path: unknown[] }) => issue.path.includes('password'))).toBe(true);
    expect(await prisma.user.count()).toBe(0);
  });

  it('rejects a body with missing fields (422)', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: valid.email });
    expect(res.status).toBe(422);
  });

  it('ignores a client-supplied role: the account is always a MEMBER', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, role: 'ADMIN' });

    expect(res.status).toBe(201);
    const row = await prisma.user.findUnique({ where: { email: valid.email } });
    expect(row?.role).toBe('MEMBER');
    expect(verifyToken(res.body.token)).toMatchObject({ role: 'MEMBER' });
  });

  // RED until you fix error.middleware.ts: today this returns 500.
  it('answers 400 to a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name": "broken"');

    expect(res.status, JSON.stringify(res.body)).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token and the user, and never the password', async () => {
    await request(app).post('/api/auth/register').send(valid).expect(201);
    const res = await request(app).post('/api/auth/login').send({ email: valid.email, password: valid.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/));
    expect(res.body.user).toMatchObject({ name: valid.name, email: valid.email });
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(valid.password);
    expect(body).not.toMatch(BCRYPT_HASH);
  });

  it('rejects a wrong password with 401', async () => {
    await request(app).post('/api/auth/register').send(valid).expect(201);
    const res = await request(app).post('/api/auth/login').send({ email: valid.email, password: 'Wrong123!' });
    expect(res.status).toBe(401);
  });

  it('gives the same 401 message for an unknown email as for a wrong password', async () => {
    await request(app).post('/api/auth/register').send(valid).expect(201);
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: valid.email, password: 'Wrong123!' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'nobody@test.example.com', password: 'Wrong123!' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });
});
