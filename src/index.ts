import express from 'express';
const app = express();
const router = express.Router();

app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'API is running' });
})

app.get('/health', (req, res) => {
  res.send({ message: 'API is running', status: 'ok', timestamp: new Date() });
})

router.use(require('./routes/task.routes'));

app.use('/api', router);


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
