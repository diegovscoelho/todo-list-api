import pool from '../database/client.js';

export const getUserTodos = async (req, res) => {
    try {
        const userId = req.user.id; 

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const offset = (page - 1) * limit;

        const sql = `
            SELECT id, title, description, is_completed, created_at 
            FROM "todos" 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            OFFSET $3;
        `;

        const values = [userId, limit, offset];
        
        const result = await pool.query(sql, values);
        
        return res.json({
            'data': result.rows,
            'page': page,
            'limit': limit,
            "total": result.rows.length,
        });

    } catch (error) {
        console.error("Failed to get user TODOs:", error);
        return res.status(500).json({ error: 'Failed to get users TODOs.' });
    }
}

export const createTodo = async (req, res) => {
    try {
        const userId = req.user.id;

        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "Title and description are mandatory." });
        }

        const sql = 'INSERT INTO "todos" (title, description, is_completed, created_at, user_id) VALUES ($1, $2, FALSE, NOW(), $3) RETURNING id, title, description';

        const values = [title, description, userId];

        const result = await pool.query(sql, values);
        const newTodo = result.rows[0];

        res.status(201).json({
            id: newTodo.id,
            title: newTodo.title,
            description: newTodo.description,
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create TODO.' });
    }
}

export const updateTodo = async (req, res) => {
    try {
        const userId = req.user.id;
        const todoId = req.params.id;

        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "Title and description are mandatory" });
        }

        const sql = `
            UPDATE "todos"
            SET 
                title = $1, 
                description = $2
            WHERE 
                id = $3 AND user_id = $4
            RETURNING id, title, description;
        `;
        
        const values = [
            title, 
            description, 
            todoId, 
            userId 
        ];

        const result = await pool.query(sql, values);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "TODO not found or unauthorized access." });
        }

        const updatedTodo = result.rows[0];

        return res.status(200).json({
            id: updatedTodo.id,
            title: updatedTodo.title,
            description: updatedTodo.description,
        });
        
    } catch (error) {
        console.error("Failed to update TODO:", error);
        return res.status(500).json({ error: 'Failed to update TODO.' });
    }
}

export const deleteTodo = async (req, res) => {
    try {
        const userId = req.user.id;
        const todoId = req.params.id;

        const sql = `
            DELETE FROM "todos"
            WHERE id = $1 AND user_id = $2
        `;

        const values = [todoId, userId];

        const result = await pool.query(sql, values);

        if(result.rowCount === 0) {
            return res.status(404).json({ message: "TODO not found or unauthorized access." });
        }

        return res.status(204).send(); 
    } catch (error) {
        console.error("Failed to delete TODO:", error);
        return res.status(500).json({ error: 'Failed to delete TODO.' });
    }
}