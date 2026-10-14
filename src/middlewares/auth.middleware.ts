import type { Request, Response, NextFunction } from "express";
import {ForbiddenError, UnauthorizedError} from "../errors/AppError.js";
import {verifyToken} from "../lib/jwt.js";
import {Role as PrismaRole} from '../../prisma/generated/client.js';

export const requireAuth =(req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Extract the token from the "Bearer <token>" format

  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  const decodedPayload = verifyToken(token);
  req.user = decodedPayload;

  next();
};

export const requireRole = (role: PrismaRole) => (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== role) {
    throw new ForbiddenError('Insufficient permissions');
  }
  next();
};
