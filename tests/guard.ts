// Refuses to run unless DATABASE_URL is the dedicated test database
// (local host, port 5434, database name ending in _test).
export function assertTestDatabase(databaseUrl: string | undefined): void {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set: the tests need .env.test');
  }

  const url = new URL(databaseUrl);
  const isLocal = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
  const isTestPort = url.port === '5434';
  const isTestName = url.pathname.endsWith('_test');
  if (!isLocal || !isTestPort || !isTestName) {
    throw new Error(
      `Refusing to run tests against ${url.hostname}:${url.port}${url.pathname}. ` +
      'Expected a local database on port 5434 whose name ends in _test.',
    );
  }
}
