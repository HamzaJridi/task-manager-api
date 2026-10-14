/**
 * Task routes.
 *
 * 📌 Key concept — express.Router()
 * A Router is a mini, mountable Express app. It lets you group related routes
 * (here, everything about "tasks") in their own file, then mount the whole
 * group under a prefix in index.ts (`app.use('/api', taskRouter)`), so every
 * path below actually resolves as `/api/tasks`, `/api/tasks/:id`, etc.
 *
 * 📌 Key concept — Middleware chaining per-route.
 * `router.post(path, middleware1, middleware2, ..., handler)` runs each
 * function in order, calling `next()` to pass control along. If any
 * middleware throws/calls `next(err)`, the chain stops and Express jumps
 * straight to the error-handling middleware (see middlewares/error.middleware.ts).
 *
 *   schemaValidator(taskSchema)  → validates & sanitizes req.body first
 *              │  (only calls next() if validation passes)
 *              ▼
 *   catchAsync(controllerFn)      → runs the controller, forwarding any
 *                                    thrown/rejected error to next(err)
 */
import express from "express";
import {addTask, deleteTask, getTaskById, getTasks, updateTask} from "../controllers/task.controller.js";
import {catchAsync} from "../utils/catchAsync.js";
import {schemaValidator} from "../middlewares/validate.middleware.js";
import {taskSchema} from "../schemas/task.schema.js";
import {requireAuth} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth); // every route below this line requires a valid token

router.get('/tasks',catchAsync(getTasks))

router.get('/tasks/:id', catchAsync(getTaskById));

// Body is validated against taskSchema *before* addTask ever runs,
// so the controller can trust req.body is well-formed.
router.post('/tasks', schemaValidator(taskSchema), catchAsync(addTask));

router.put('/tasks/:id', schemaValidator(taskSchema), catchAsync(updateTask));

// No body to validate on DELETE — just needs the :id param.
router.delete('/tasks/:id', catchAsync(deleteTask));



export default router;

