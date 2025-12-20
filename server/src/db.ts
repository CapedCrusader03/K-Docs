import { Pool } from 'pg';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.POSTGRES_USER || 'admin',
  password: process.env.POSTGRES_PASSWORD || 'simplepass',
  database: process.env.POSTGRES_DB || 'kdocs',
};

const pool = new Pool(dbConfig);

export { pool };

export async function checkDb(): Promise<void> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', result.rows[0].now);
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

