import express from "express";
import { randomUUID } from 'crypto';

const router = express.Router();

const TASK_STATUSES = ['todo', 'in progress', 'done'] as const;

type TaskStatus = (typeof TASK_STATUSES)[number];

type Task = {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
};

const isTaskStatus = (value: unknown): value is TaskStatus => {
  return typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus);
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const toTask = (value: unknown): Task | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const task = value as Partial<Task>;

  if (
    !isNonEmptyString(task.id) ||
    !isNonEmptyString(task.name) ||
    !isNonEmptyString(task.description) ||
    !isTaskStatus(task.status)
  ) {
    return null;
  }

  return {
    id: task.id,
    name: task.name.trim(),
    description: task.description.trim(),
    status: task.status,
  };
};

let tasks: Task[] = [
  {
    id: "1", name: 'Task 1',
    description: 'Task 1',
    status: 'todo',
  },
  {
    id: "2", name: 'Task 2',
    description: 'Task 2',
    status: 'in progress',
  },
  {
    id: "3", name: 'Task 3',
    description: 'Task 3',
    status: 'done',
  },
]

router.get('/tasks', (req, res) => {
  res.json(tasks);
})

router.get('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const task = tasks.find((x) => x.id === id);

  if (!task) {
    return res.status(404).send('Not Found');
  }

  return res.json(task);
})

router.post('/tasks', (req, res) => {
  const task = toTask({
    id: randomUUID(),
    ...req.body,
  });

  if (!task) {
    return res.status(400).json({
      message: 'Bad Request',
      details: {
        requiredFields: ['name', 'description', 'status'],
        allowedStatusValues: TASK_STATUSES,
      },
    });
  }

  tasks.push(task);
  return res.status(201).json(task);
})

router.put('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const index = tasks.findIndex((x) => x.id === id);

  if (index === -1) {
    return res.status(404).send('Not Found');
  }

  if (req.body?.id && req.body.id !== id) {
    return res.status(400).json({
      message: 'Bad Request',
      details: {
        id: 'Task id cannot be changed',
      },
    });
  }

  const updatedTask = toTask({
    ...tasks[index],
    ...req.body,
    id,
  });

  if (!updatedTask) {
    return res.status(400).json({
      message: 'Bad Request',
      details: {
        requiredFields: ['name', 'description', 'status'],
        allowedStatusValues: TASK_STATUSES,
      },
    });
  }

  tasks[index] = updatedTask;
  return res.json(tasks[index]);
})

router.delete('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const index = tasks.findIndex((x) => x.id === id);

  if (index === -1) {
    return res.status(404).send('Not Found');
  }

  tasks = tasks.filter((x) => x.id !== id);
  return res.status(204).send();
})

export default router;

