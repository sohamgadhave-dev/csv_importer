import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB, getPool } from '../src/db/connection';
import type { ResultSetHeader } from 'mysql2';

async function seed() {
  console.log('🌱 Starting database seeding...');
  await connectDB();
  const pool = getPool();

  try {
    const browserId = 'seed-browser-123';
    
    // 1. Create an import record
    const [importResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO imports (original_filename, browser_id, total_imported, total_skipped) 
       VALUES (?, ?, ?, ?)`,
      ['sample_leads.csv', browserId, 3, 1]
    );
    const importId = importResult.insertId;
    console.log(`✅ Created import record with ID: ${importId}`);

    // 2. Insert CRM records
    const crmRecords = [
      [importId, 'John Doe', 'john.doe@example.com', '1234567890', 'Acme Corp', 'New York', 'NY', 'USA', 'New', 'csv', 'Seed data 1'],
      [importId, 'Jane Smith', 'jane.smith@example.com', '0987654321', 'Globex', 'San Francisco', 'CA', 'USA', 'Contacted', 'csv', 'Seed data 2'],
      [importId, 'Bob Johnson', 'bob.j@example.com', '5551234567', 'Initech', 'Austin', 'TX', 'USA', 'Qualified', 'csv', 'Seed data 3'],
    ];

    await pool.query(
      `INSERT INTO crm_records 
       (import_id, name, email, phone, company, city, state, country, crm_status, data_source, notes) 
       VALUES ?`,
      [crmRecords]
    );
    console.log(`✅ Created ${crmRecords.length} CRM records`);

    // 3. Insert skipped records
    const skippedRecords = [
      [importId, 4, 'Missing email and phone', JSON.stringify({ name: 'Unknown Lead', company: 'Mystery Inc' })],
    ];

    await pool.query(
      `INSERT INTO skipped_records (import_id, \`row_number\`, reason, raw_data) VALUES ?`,
      [skippedRecords]
    );
    console.log(`✅ Created ${skippedRecords.length} skipped records`);

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await disconnectDB();
  }
}

seed();
