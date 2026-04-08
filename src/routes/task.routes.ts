import express from "express";

const app = express();

let tasks = [
  {
    id: "1", name: 'Task 1',
    description: 'Task 1',
  },
  {
    id: "2", name: 'Task 2',
    description: 'Task 2',
  },
  {
    id: "3", name: 'Task 3',
    description: 'Task 3',
  },
]

app.get('/api/tasks', (req, res) => {
  res.send(tasks);
})

app.get('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  const task = tasks.find((x) => x.id === id);

  if (!task) {
    return res.status(404).send('Not Found');
  }

  return res.json(task);
})


app.post('/api/tasks', (req, res) => {
  const task = req.body;
  if (!task || !task.name || !task.description) {
    return res.status(400).send('Bad Request');
  }

  task.id = crypto.randomUUID();
  tasks.push(task);
  return res.status(201).json(task);
})

app.put('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  let task = tasks.find((x) => x.id === id);

  if (!task) {
    return res.status(404).send('Not Found');
  }

  task = { ...task, ...req.body };
  return res.json(task);
})

app.delete('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  const task = tasks.find((x) => x.id !== id);
  if (!task) {
    return res.status(404).send('Not Found');
  }

  tasks = tasks.filter((x) => x.id === id);
  return res.status(204).send();
})
