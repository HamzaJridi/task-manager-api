// Entry point: loads .env, then starts the HTTP server.
// Import order matters: 'dotenv/config' must run before anything reads process.env.
import 'dotenv/config';
import app from './app.js';
import { env } from './schemas/env.schema.js';

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
