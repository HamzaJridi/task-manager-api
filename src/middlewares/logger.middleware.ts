/**
 * 📌 Key concept — Request logging middleware.
 * A middleware is just a function `(req, res, next) => void` that runs
 * before the route handler. Here it measures elapsed time and logs it
 * once the response finishes.
 *
 * 📌 Key concept — res.on('finish', ...)
 * We can't log the duration/status *before* calling next(), because the
 * response hasn't been sent yet. Instead we listen for the 'finish' event
 * on the response object, which fires after Express has flushed all
 * headers/body to the client — that's when `res.statusCode` is final.
 *
 * `next()` is called immediately (synchronously) so the request keeps
 * flowing to the next middleware/route; the 'finish' listener fires later,
 * asynchronously, once the response actually completes.
 */

import { pinoHttp } from 'pino-http';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { logger } from '../lib/logger.js';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: Request, res: Response) => {
    const existingId = req.headers['x-request-id'];
    if (existingId) return existingId as string;
    const id = randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
});
