# Task Manager API

![CI](https://github.com/HamzaJridi/task-manager-api/actions/workflows/ci.yml/badge.svg)

A REST API for managing tasks, with JWT authentication and role-based access. Built with Node.js, Express 5, TypeScript, Prisma 7 and PostgreSQL, containerised with Docker and checked by an automated CI pipeline.

## Stack

| Area | Tools |
|---|---|
| Runtime and framework | Node.js 22, Express 5, TypeScript |
| Database | PostgreSQL 18 (pgvector image), Prisma 7 with the `@prisma/adapter-pg` driver |
| Validation and auth | Zod, JWT, bcrypt, helmet, CORS, rate limiting on the auth routes |
| Logging | pino and pino-http (JSON logs, request IDs, redacted secrets) |
| Tests | Vitest and supertest against a real Postgres test database |
| Delivery | Docker (multi-stage image), Docker Compose, GitHub Actions |

## Features

- Register and login with hashed passwords and signed tokens
- Two roles: `MEMBER` sees and edits only their own tasks, `ADMIN` sees everything
- Task CRUD with ownership checks, pagination (`page`, `limit` up to 100) and a `status` filter
- Request validation with Zod and one central error handler
- A `/health` endpoint that checks the database and answers 503 when it is down

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | none | create an account, returns a token |
| POST | `/api/auth/login` | none | log in, returns a token |
| GET | `/api/tasks` | Bearer token | list tasks (own tasks, or all for ADMIN) |
| POST | `/api/tasks` | Bearer token | create a task |
| GET / PUT / DELETE | `/api/tasks/:id` | Bearer token | read, replace or delete a task you own |
| GET | `/health` | none | liveness and database check |

## Run it with Docker

```bash
cp .env.example .env        # then fill in the values
docker compose up -d --build
```

The stack starts a local Postgres, applies the migrations in a one-off job, then starts the API on `http://localhost:3000`.

## Develop locally

```bash
npm install
npx prisma generate
npm run dev
```

## Tests and CI

```bash
npm run typecheck           # tsc --noEmit
npm test                    # starts the test database with Docker, then runs Vitest
```

On every push and pull request, GitHub Actions installs the dependencies, generates the Prisma client, typechecks, runs the tests against a Postgres service container and builds the Docker image. `main` is protected: a change merges only when the `ci` check passes.

## Project layout

```
src/
  app.ts            Express app (no listen, used by the tests)
  index.ts          entry point: loads .env and starts the server
  routes/           URL to controller mapping
  controllers/      request handlers
  middlewares/      auth, validation, errors, logging, rate limiting
  schemas/          Zod schemas and environment validation
  lib/              Prisma client, JWT helpers, logger
prisma/             schema, migrations, seed scripts
tests/              integration and unit tests
```

## Status

Work in progress: deployment to AWS and a full architecture write-up are next.
