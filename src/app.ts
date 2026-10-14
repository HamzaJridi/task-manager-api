// The Express app, WITHOUT listen(): tests import it, index.ts starts it.
// Note: 'dotenv/config' is deliberately NOT imported here. Only index.ts loads .env,
// so a test run can never pick up the dev (or Neon) DATABASE_URL by accident.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { httpLogger } from './middlewares/logger.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { env } from './schemas/env.schema.js';
import authRouter from './routes/auth.routes.js';
import taskRouter from './routes/task.routes.js';
import healthRouter from './routes/health.routes.js';

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(helmet());
app.use(express.json());
app.use(httpLogger);

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use(healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', taskRouter);

// Error handler: must stay last.
app.use(errorHandler);

export default app;
