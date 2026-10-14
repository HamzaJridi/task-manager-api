/**
 * Task controller — the actual request handlers ("business logic").
 *
 * 📌 Key concept — Controllers stay "dumb" on purpose.
 * By the time a request reaches these functions, the router has already:
 *   1. Validated req.body with Zod (schemaValidator) for POST/PUT.
 *   2. Wrapped the handler with catchAsync, so any thrown error (sync or
 *      async) is forwarded to the error-handling middleware automatically.
 * That means handlers here can simply `throw new SomeAppError(...)` instead
 * of manually building error responses with `res.status(...).json(...)`.
 *
 * 📌 Key concept — In-memory "database".
 * `tasks` is a plain array living in process memory. It resets whenever the
 * server restarts, and would NOT be shared across multiple server instances.
 * This is intentional for learning purposes — it lets you focus on
 * Express/routing/validation/error-handling without needing a real database.
 */
import type {Request, Response} from 'express';
import {randomUUID} from "crypto";
import {BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError} from "../errors/AppError.js";
import {idParamSchema, type Task, taskQuerySchema} from "../schemas/task.schema.js";
import prisma from "../lib/prisma.js";
import type {JwtPayload} from "../lib/jwt.js";

export const getTasks = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Authentication required');

  const { page, limit, status } = taskQuerySchema.parse(req.query);

  const where = {
    ...(status !== undefined && { status }),
    ...(req.user.role !== 'ADMIN' && { userId: req.user.userId }),
  };

  const tasks = await prisma.task.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
  });
  res.json(tasks);
}

export const getTaskById = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Authentication required');

  const { id } = idParamSchema.parse(req.params);
  const task = await getOwnedTaskOrThrow(id, req.user);

  return res.json(task);
}

export const addTask = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Authentication required');

  // req.body is already validated & parsed by schemaValidator(taskSchema)
  // (see routes/task.routes.ts) — no need to re-check fields here.
  const task = req.body;
  const createdTask = await prisma.task.create({
    data: { ...task, userId: req.user.userId },
  });

  return res.status(201).json(createdTask);
}

export const updateTask = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Authentication required');

  const { id } = idParamSchema.parse(req.params);
  const task = await getOwnedTaskOrThrow(id, req.user);

  // Guard against clients trying to change the resource's identity via the body.
  // The URL param (:id) is always the source of truth for "which resource".
  if (req.body?.id && req.body.id !== id) throw new BadRequestError('Task id cannot be changed');

  const updatedTask = await prisma.task.update({
    where: { id },
    data: { ...req.body },
  });

  return res.json(updatedTask);
}

export const deleteTask = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Authentication required');

  const { id } = idParamSchema.parse(req.params);
  const task = await getOwnedTaskOrThrow(id, req.user);

  await prisma.task.delete({ where: { id } });
  // 204 No Content: successful deletion, nothing to return in the body.
  return res.status(204).send();
}

const getOwnedTaskOrThrow = async (taskId: string, user: JwtPayload) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new NotFoundError('Task not found');

  if (task.userId !== user.userId && user.role !== 'ADMIN') {
    throw new ForbiddenError('You do not have access to this task');
  }

  return task;
}
