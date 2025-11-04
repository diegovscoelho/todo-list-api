import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/client.js';

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are mandatory." });
        }

        const userExists = await pool.query('SELECT id FROM "users" WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: "Invalid email." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO "users" (name, email, password) VALUES ($1, $2, $3) RETURNING id, email';
        const result = await pool.query(sql, [name, email, hashedPassword]);
        const newUser = result.rows[0];

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(201).json({
            token: token
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Failed to create user.' });
    }
}

export const login = async (req, res) => {
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

        return res.status(200).json({
            token: token
        });
    } catch (error) {
        console.error("Failed to login:", error);
        return res.status(500).json({ error: 'Failed to login.' });
    }
}