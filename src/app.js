import express from 'express';
import authRoutes from './routes/authRoutes.js';
import todoRoutes from './routes/todoRoutes.js';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/', authRoutes);

app.use('/todos', todoRoutes);

app.listen(port, () => {
    console.log(`Server listening to port ${port}`);
});