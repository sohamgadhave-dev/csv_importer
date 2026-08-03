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
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Enable SSL for cloud database providers (Aiven, TiDB, etc.)
      ...(process.env.NODE_ENV === 'production' ? { ssl: { rejectUnauthorized: true } } : {})
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log(`✅ Connected to MySQL Database: ${database}`);
    connection.release();

    // Auto-create tables if they don't exist
    await initializeTables();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Create required tables if they don't exist (auto-migration).
 */
async function initializeTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_filename VARCHAR(255) NOT NULL,
        browser_id VARCHAR(255) NOT NULL,
        total_imported INT NOT NULL DEFAULT 0,
        total_skipped INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS crm_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        import_id INT NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        company VARCHAR(255),
        city VARCHAR(255),
        state VARCHAR(255),
        country VARCHAR(255),
        crm_status VARCHAR(100) DEFAULT 'New',
        data_source VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS skipped_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        import_id INT NOT NULL,
        \`row_number\` INT,
        reason TEXT NOT NULL,
        raw_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database tables verified/created');
  } catch (error) {
    console.error('❌ Failed to initialize tables:', error instanceof Error ? error.message : error);
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
