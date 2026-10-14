// Shared test helpers. REPLACES the earlier helpers.ts (merge if you changed yours).
// The first integration test (Manual) is written WITHOUT these, by you.
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';

let counter = 0;
const DEFAULT_PASSWORD = 'Password123!';

export const bearer = (token: string): string => `Bearer ${token}`;

// Registers a MEMBER through the real API, then logs in through the real API.
export async function registerAndLogin(
  overrides: { name?: string; email?: string; password?: string } = {},
) {
  counter += 1;
  const name = overrides.name ?? `User ${counter}`;
  const email = overrides.email ?? `user${counter}@test.example.com`;
  const password = overrides.password ?? DEFAULT_PASSWORD;

  const registered = await request(app).post('/api/auth/register').send({ name, email, password });
  if (registered.status >= 400) {
    throw new Error(`register failed: ${registered.status} ${JSON.stringify(registered.body)}`);
  }
  const login = await request(app).post('/api/auth/login').send({ email, password });
  if (login.status >= 400) {
    throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }
  return { name, email, password, token: login.body.token as string, user: login.body.user };
}

// The API cannot create an ADMIN (register always gives MEMBER), so insert one directly,
// then log in through the real API. A low bcrypt cost keeps the test fast.
export async function createAdminAndLogin() {
  counter += 1;
  const email = `admin${counter}@test.example.com`;
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 4);
  const admin = await prisma.user.create({
    data: { name: `Admin ${counter}`, email, password, role: 'ADMIN' },
  });
  const login = await request(app).post('/api/auth/login').send({ email, password: DEFAULT_PASSWORD });
  if (login.status >= 400) {
    throw new Error(`admin login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }
  return { token: login.body.token as string, user: admin };
}

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type CreatedTask = {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export async function createTask(
  token: string,
  overrides: { name?: string; description?: string; status?: TaskStatus } = {},
): Promise<CreatedTask> {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', bearer(token))
    .send({ name: 'Write report', description: 'Quarterly numbers', status: 'TODO', ...overrides });
  if (res.status !== 201) {
    throw new Error(`createTask failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body as CreatedTask;
}
