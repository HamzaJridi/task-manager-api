  /**
 * 📌 Key concept — Zod: schema = single source of truth for validation + types.
 * Instead of hand-writing an interface AND separate validation logic, we
 * define the shape once as a Zod schema, then derive the TypeScript type
 * from it with `z.infer<typeof taskSchema>`. If the schema changes, the
 * type updates automatically — no risk of them drifting apart.
 *
 * `taskSchema` deliberately does NOT include `id` — the id is
 * server-generated (see controllers/task.controller.ts: `randomUUID()`),
 * so `Task` = the validated input (`TaskInput`) plus an `id` field.
 */
import { z } from 'zod';
import { TaskStatus as PrismaTaskStatus } from '../../prisma/generated/client.js';
export type Task = TaskInput & { id: string };
export type TaskInput = z.infer<typeof taskSchema>;

export const taskSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  status: z.enum(PrismaTaskStatus, { message: `Status must be one of: ${Object.values(PrismaTaskStatus).join(', ')}` })
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100, { message: 'Limit exceeds maximum of 100' }).optional().default(100),
  status: z.enum(PrismaTaskStatus, { message: `Status must be one of: ${Object.values(PrismaTaskStatus).join(', ')}` }).optional()
});

export const idParamSchema = z.object({
  id: z.uuid({ message: 'Invalid task id format' }),
});
