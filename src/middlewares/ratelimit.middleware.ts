import rateLimit from 'express-rate-limit';
import {AppError} from "../errors/AppError.js";
import {env} from "../schemas/env.schema.js";

// Rate limiting middleware to prevent abuse and brute-force attacks
export const createAuthRateLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  handler: (req, res, next) => next(new AppError('Too many requests, please try again later.', 429)),
});
