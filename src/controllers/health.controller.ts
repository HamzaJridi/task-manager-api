import type { Request, Response } from 'express';
import prisma from "../lib/prisma.js";
import {ServiceUnavailableError} from "../errors/AppError.js";

export const checkHealth = async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    req.log.error({ err: error }, 'Database health check failed');
    throw new ServiceUnavailableError('Database connection failed');
  }

  res.json({ status: 'ok', timestamp: new Date(), db: 'ok' });
}
