import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString, 
    ssl: connectionString ? { rejectUnauthorized: false } : false,
});

export default pool;