import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load ONLY .env.test, and let it win over anything already in the shell.
const loaded = config({ path: '.env.test', override: true, quiet: true });
if (loaded.error || !loaded.parsed) {
  throw new Error('.env.test is missing: copy .env.test.example to .env.test');
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: loaded.parsed,
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/setup.ts'],
    // All test files share one database: run them one after another.
    fileParallelism: false,
  },
});
