import express from 'express';
import taskRouter from './routes/task.routes.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'API is running' });
})

app.get('/health', (req, res) => {
  res.send({ message: 'API is running', status: 'ok', timestamp: new Date() });
})

app.use('/api', taskRouter);


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
