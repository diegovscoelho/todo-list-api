import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './database/client.js';

const app = express();

const port = 3000;

app.use(express.json());

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha são obrigatórios." });
        }

        const userExists = await pool.query('SELECT id FROM "users" WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: "Usuário com este email já existe." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO "users" (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email';
        const result = await pool.query(sql, [name, email, hashedPassword]);
        const newUser = result.rows[0];

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(201).json({
            message: "User created successfully.",
            user: { id: newUser.id, email: newUser.email, name: newUser.name },
            token: token
        });
    } catch (error) {
        console.error("Erro no registro:", error);
        return res.status(500).json({ error: 'Failed to create user.' });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({ error: 'Email and password are mandatory.' });
        }

        const userResult = await pool.query('SELECT id, name, email, password FROM "users" WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if(!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const { password: _, ...userInfo } = user;

        return res.status(200).json({
            message: "Login bem-sucedido.",
            user: userInfo,
            token: token
        });
    } catch (error) {
        console.error("Failed to login:", error);
        return res.status(500).json({ error: 'Failed to login.' });
    }
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ error: "Access denied. Token not provided." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Expired or invalid token" });
        }
        
        req.user = user;

        next(); 
    });
};

const getUserTodos = async (req, res) => {
    try {
        const userId = req.user.id; 

        const sql = `
            SELECT id, title, description, is_completed, created_at 
            FROM "todos" 
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        
        const result = await pool.query(sql, [userId]);
        
        return res.json(result.rows);

    } catch (error) {
        console.error("Failed to get user TODOs:", error);
        return res.status(500).json({ error: 'Failed to get users TODOs.' });
    }
}

const createTodo = async (req, res) => {
    try {
        const userId = req.user.id;

        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "Title and description are mandatory." });
        }

        const sql = 'INSERT INTO "todos" (title, description, is_completed, created_at, user_id) VALUES ($1, $2, FALSE, NOW(), $3) RETURNING id, title, description, is_completed, created_at, user_id';

        const values = [title, description, userId];

        const result = await pool.query(sql, values);
        const newTodo = result.rows[0];

        res.status(201).json(newTodo);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create TODO.' });
    }
}

const deleteTodo = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const todoId = req.params.id;

        if (!todoId) {
             return res.status(400).json({ error: "Task ID is mandatory." });
        }
        
        const sql = 'DELETE FROM "todos" WHERE id = $1 AND user_id = $2 RETURNING id';
        const result = await pool.query(sql, [todoId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Task not found or access denied.' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error("Failed to delete TODO:", error);
        return res.status(500).json({ error: 'Failed to delete TODO.' });
    }
}

app.get('/todos', authenticateToken, getUserTodos);
app.post('/register', register);
app.post('/login', login);
app.post('/todos', authenticateToken, createTodo);

app.listen(port, () => {
    console.log(`Servidor escutando na porta ${port}`);
});