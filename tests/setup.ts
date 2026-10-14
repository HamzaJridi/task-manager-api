// Runs in every test file, before its tests.
import { afterAll, beforeEach } from 'vitest';
import prisma from '../src/lib/prisma.js';
import { assertTestDatabase } from './guard.js';

assertTestDatabase(process.env.DATABASE_URL);

// Every test starts from empty tables (the structure stays, only the rows go).
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE "Task", "User" RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
