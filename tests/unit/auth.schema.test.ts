// Unit tests: no HTTP, no database use. Pure validation rules.
import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../../src/schemas/auth.schema.js';

const base = { name: 'Test User', email: 'unit@test.example.com' };

describe('registerSchema password rules', () => {
  it('accepts a strong password', () => {
    expect(registerSchema.safeParse({ ...base, password: 'Password123!' }).success).toBe(true);
  });

  it.each([
    ['too short', 'Aa1!'],
    ['no uppercase letter', 'password123!'],
    ['no lowercase letter', 'PASSWORD123!'],
    ['no number', 'Password!!!'],
    ['no symbol', 'Password123'],
  ])('rejects a password with %s', (_label, password) => {
    const result = registerSchema.safeParse({ ...base, password });
    expect(result.success).toBe(false);
  });

  it('does not let a role through: the field is stripped', () => {
    const result = registerSchema.safeParse({ ...base, password: 'Password123!', role: 'ADMIN' });
    expect(result.success).toBe(true);
    expect(result.success ? result.data : undefined).not.toHaveProperty('role');
  });
});

describe('loginSchema', () => {
  // D6: login must accept passwords created before the complexity rules existed.
  it('accepts a weak legacy password (the complexity rules apply at registration only)', () => {
    expect(loginSchema.safeParse({ email: base.email, password: 'x' }).success).toBe(true);
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: base.email, password: '' }).success).toBe(false);
  });
});
