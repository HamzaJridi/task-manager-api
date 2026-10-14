import jwt from 'jsonwebtoken';
import { env } from '../schemas/env.schema.js';

export type JwtPayload = {
  userId: string;
  role: string;
};

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
