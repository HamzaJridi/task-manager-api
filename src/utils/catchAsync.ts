/**
 * 📌 Key concept — Why catchAsync exists.
 * Express (v4) does NOT catch errors thrown inside async functions.
 * If an `async` route handler rejects (e.g. a DB call throws), Express
 * has no idea — the request just hangs, or the process crashes on an
 * unhandled rejection, depending on your Node version/config.
 *
 * `catchAsync` is a wrapper: it takes a handler, invokes it, and if the
 * returned promise rejects (or the function throws synchronously), it
 * forwards the error to `next(err)` — routing it straight into our
 * error-handling middleware (middlewares/error.middleware.ts).
 *
 * Usage: wrap any controller before passing it to the router.
 *   router.get('/tasks/:id', catchAsync(getTaskById));
 *
 * `RequestHandler` (from express) is the proper type for "a function shaped
 * like an Express handler" — prefer it over the overly-broad `Function` type.
 */
import type {NextFunction, Request, RequestHandler, Response} from "express";

export const catchAsync = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
