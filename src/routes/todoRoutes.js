import express from 'express';
import { getUserTodos, createTodo, updateTodo, deleteTodo } from '../controllers/todoController.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getUserTodos);
router.post('/', authenticateToken, createTodo);

router.put('/:id', authenticateToken, updateTodo);
router.delete('/:id', authenticateToken, deleteTodo);

export default router;