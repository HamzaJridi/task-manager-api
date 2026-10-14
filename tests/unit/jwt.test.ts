import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../../src/lib/jwt.js';
import { env } from '../../src/schemas/env.schema.js';

describe('JWT utility', () => {
  it('round-trips the payload', () => {
    const token = generateToken({ userId: 'user-1', role: 'MEMBER' });
    expect(verifyToken(token)).toMatchObject({ userId: 'user-1', role: 'MEMBER' });
  });

  it('issues tokens that expire', () => {
    const payload = verifyToken(generateToken({ userId: 'user-1', role: 'MEMBER' })) as { exp?: number };
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects a token whose payload was edited (a forged ADMIN role)', () => {
    const [header, , signature] = generateToken({ userId: 'user-1', role: 'MEMBER' }).split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ userId: 'user-1', role: 'ADMIN' })).toString('base64url');

    expect(() => verifyToken(`${header}.${forgedPayload}.${signature}`)).toThrow(jwt.JsonWebTokenError);
  });

  it('rejects a token signed with another secret', () => {
    const token = jwt.sign({ userId: 'user-1', role: 'MEMBER' }, 'some-other-secret');
    expect(() => verifyToken(token)).toThrow(jwt.JsonWebTokenError);
  });

  it('rejects an expired token with TokenExpiredError', () => {
    const expired = jwt.sign(
      { userId: 'user-1', role: 'MEMBER', exp: Math.floor(Date.now() / 1000) - 60 },
      env.JWT_SECRET,
    );
    expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);
  });
});
