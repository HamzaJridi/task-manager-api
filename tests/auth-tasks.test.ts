import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import {verifyToken} from "../src/lib/jwt.js";
import prisma from "../src/lib/prisma.js";

describe('register, login, create a task, fetch it', () => {
  it('lets a new user create a task and read it back', async () => {
    // arrange, act, assert: yours

    // should register a new user, returns a status code 201 and return a user object with valid token, id, name & email, shouldn't return the password
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'Password123!',
      });

    const body = JSON.stringify(registerRes.body);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body).toHaveProperty('token', expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/));
    expect(verifyToken(registerRes.body.token)).toMatchObject({ userId: registerRes.body.user.id })

    expect (registerRes.body.token, 'Expect token is defined').toBeDefined();
    expect(registerRes.body, 'Expect to has user object').toHaveProperty('user');
    expect(registerRes.body.user, 'Expect user to have id').toHaveProperty('id');
    expect(registerRes.body.user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(registerRes.body.user, 'Expect user to have name').toHaveProperty('name', 'Test User');
    expect(registerRes.body.user, 'Expect user to have email').toHaveProperty('email', 'testuser@example.com');
    expect(body).not.toContain('Password123!');
    expect(body).not.toMatch(/\$2[aby]\$/); // a bcrypt hash, under any key name

    // should login the user, returns a status code 200 and return a user object with a valid token, id, name & email, shouldn't return the password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: 'Password123!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user).toMatchObject({ id: registerRes.body.user.id, email: 'testuser@example.com' });
    const token = loginRes.body.token;

    //should create a new task, with req body contains name, description, status, returns a status code 201 and return a task object with valid id, name, description, status, userId (same as the logged userId), createdAt & updatedAt
    const taskBody = { name: 'First task', description: 'Written by the happy path', status: 'TODO' };
    const createRes = await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send(taskBody);
    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({ ...taskBody, userId: registerRes.body.user.id });

    // should fetch db and check that the task is created and returned in the list of tasks for the user, returns a status code 200 and return an array of task objects with valid id, name, description, status, userId (same as the logged userId), createdAt & updatedAt
    const fetchRes = await request(app).get(`/api/tasks/${createRes.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(fetchRes.body).toEqual(createRes.body);
    const row = await prisma.task.findUnique({ where: { id: createRes.body.id } });
    expect(row?.userId).toBe(registerRes.body.user.id);
  });
});
