import type {JwtPayload} from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      // Add a `user` property to the Request type, so TypeScript knows it exists.
      user?: JwtPayload;
    }
  }
}

export {};
