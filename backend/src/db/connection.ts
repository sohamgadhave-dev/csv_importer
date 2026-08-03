/**
 * MySQL connection module with connection pooling.
 */

import mysql from 'mysql2/promise';

let pool: mysql.Pool;

/**
 * Initialize MySQL connection pool.
 */
export async function connectDB(): Promise<void> {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'csv_importer';

  try {
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log(`✅ Connected to MySQL Database: ${database}`);
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Gracefully close the MySQL connection pool.
 */
export async function disconnectDB(): Promise<void> {
  try {
    if (pool) {
      await pool.end();
      console.log('MySQL pool disconnected');
    }
  } catch (error) {
    console.error('Error disconnecting from MySQL:', error);
  }
}

/**
 * Get the connection pool for queries.
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call connectDB() first.');
  }
  return pool;
}
