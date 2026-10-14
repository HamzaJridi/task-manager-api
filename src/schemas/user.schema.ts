import { z } from 'zod';
import {Role as PrismaRole} from '../../prisma/generated/client.js';

export const userSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.email({ message: 'Invalid email format' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one symbol' }),
  role: z.enum(PrismaRole, { message: `Role must be one of: ${Object.values(PrismaRole).join(', ')}` })
})

export type UserInput = z.infer<typeof userSchema>;
export type User = UserInput & { id: string };
