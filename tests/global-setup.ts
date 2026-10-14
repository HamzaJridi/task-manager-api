// Runs ONCE before the whole suite (not before each test).
import { execSync } from 'node:child_process';
import { assertTestDatabase } from './guard.js';

export default function setup(): void {
  const databaseUrl = process.env.DATABASE_URL;
  assertTestDatabase(databaseUrl);

  // Create the tables in the empty test database. DATABASE_URL is passed explicitly so
  // prisma.config.ts can never fall back to the .env file (which points at Neon).
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}
