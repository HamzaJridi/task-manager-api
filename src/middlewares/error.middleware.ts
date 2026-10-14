/**
 * Centralized error-handling middleware.
 *
 * 📌 Key concept — Express identifies error middlewares by their signature:
 * exactly 4 params (err, req, res, next). It must be registered LAST in
 * index.ts, after every route/middleware, so it can catch errors from
 * anywhere upstream via `next(err)` (including errors forwarded automatically
 * by catchAsync — see utils/catchAsync.ts).
 *
 * This gives us ONE place to decide how errors look on the wire, instead of
 * scattering `res.status(...).json(...)` calls across every controller.
 *
 * Order of checks matters here — most specific error types first, generic
 * fallback last:
 *   1. AppError (and subclasses like NotFoundError/BadRequestError) → our own
 *      "expected" errors, already carry the right HTTP status code.
 *   2. ZodError → thrown by schemaValidator when req.body fails validation.
 *   3. Anything else → an unexpected/programmer error; respond 500 and avoid
 *      leaking internals to the client in production.
 */
import type {NextFunction, Request, Response} from "express";
import { Prisma } from '../../prisma/generated/client.js';
import jwt from 'jsonwebtoken';

import {AppError} from "../errors/AppError.js";
import {z} from "zod";
import {env} from "../schemas/env.schema.js";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof z.ZodError) {
    // err.issues is Zod's structured list of validation problems
    // (field path, message, expected type, etc.) — much more useful to
    // API consumers than a single flat string.
    return res.status(422).json({ errors: err.issues });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Resource not found from Prisma P2025' });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Resource already exists from Prisma P2002' });
  }

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ message: 'Token has expired' });
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }

  // Unknown/unexpected error (e.g. a bug). Only expose the message/stack
  // in development so we don't leak implementation details in production.
  res.status(500).json({
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' && { error: err.message, stack: err.stack }),
  });
  console.log('********* Error Stack Start ***********');
  console.error(err.stack);
  console.log('********* Error Stack End ***********');
}
