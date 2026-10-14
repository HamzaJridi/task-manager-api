/**
 * Generic request-body validation middleware, powered by Zod.
 *
 * 📌 Key concept — Higher-order middleware factory.
 * `schemaValidator` is NOT itself a middleware — it's a function that
 * RETURNS one, configured for a specific schema. This is what lets a single
 * generic implementation validate any route:
 *
 *   router.post('/tasks', schemaValidator(taskSchema), ...)
 *   router.post('/users', schemaValidator(userSchema), ...)
 *
 * `z.ZodType` is Zod's base type for "any schema", so this isn't locked to
 * one specific shape.
 *
 * 📌 Key concept — schema.parse() throws, and Express propagates it for us.
 * `schema.parse(req.body)` throws a `ZodError` on invalid input. Since this
 * middleware isn't async, Express does NOT automatically catch that — we
 * must catch it ourselves and call `next(error)` to forward it to the
 * error-handling middleware (middlewares/error.middleware.ts).
 *
 * 📌 Bonus: parse() also returns the *parsed* value (with defaults applied,
 * extra keys stripped, types coerced, etc.), so we reassign it to req.body —
 * downstream handlers get clean, trusted data.
 */
import type {NextFunction, Request, Response} from "express";
import {z} from "zod";

export const schemaValidator = (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
