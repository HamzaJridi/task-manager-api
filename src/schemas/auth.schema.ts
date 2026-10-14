import { z } from 'zod';
import { userSchema } from './user.schema.js';

export const registerSchema = userSchema.omit({ role: true });

export const loginSchema = z.object({
  email: z.email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

